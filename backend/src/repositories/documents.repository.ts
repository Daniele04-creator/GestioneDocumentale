import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import type { DocumentStatus } from "../entities/document.entity";

export type DocumentFilters = {
	projectId: string;
	packageId?: string;
	ownerId?: string;
	tag?: string;
	status?: DocumentStatus;
	search?: string;
};

export type PublicFileInfo = {
	fileName: string;
	mimeType: string;
	sizeBytes: number;
};

export type InternalFileInfo = PublicFileInfo & {
	storagePath: string;
};

export type DocumentRow = {
	id: string;
	title: string;
	description?: string;
	status: DocumentStatus;
	project: { id: string; name: string };
	package: { id: string; name: string };
	parentPackage: { id: string; name: string } | null;
	owner: { id: string; name: string };
	fileInfo?: PublicFileInfo;
	version: number;
	createdAt: string;
	updatedAt: string | null;
	archivedAt: string | null;
	tags?: Array<{ name: string }>;
};

export type DocumentTreeRow = {
	package_id: string;
	package_name: string;
	parent_package_id: string | null;
	parent_package_name: string | null;
	document_count: number;
	draft_count: number;
	in_review_count: number;
	approved_count: number;
	archived_count: number;
};

export type UpdateDocumentChanges = {
	title?: string;
	description?: string;
	status?: DocumentStatus;
	archivedAt?: string;
	updatedAt?: string;
};

@Injectable()
export class DocumentsRepository {
	constructor(private readonly dataSource: DataSource) {}

	async findAll(filters: DocumentFilters): Promise<DocumentRow[]> {
		const where: string[] = [];
		const params: unknown[] = [];

		this.addTextSearchFilter(where, params, filters.search);
		this.addPlainFilter(where, params, "d.status", filters.status);
		this.addPlainFilter(where, params, "pr.id", filters.projectId);
		this.addPlainFilter(where, params, "p.id", filters.packageId);
		this.addPlainFilter(where, params, "o.id", filters.ownerId);
		this.addTagFilter(where, params, filters.tag);

		const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
		const rows = await this.dataSource.query(
			`
				SELECT ${this.documentSelectColumnsSql()}
				${this.documentFromSql()}
				${whereSql}
				ORDER BY COALESCE(d.updated_at, d.created_at) DESC
			`,
			params,
		);

		return this.addTagsToDocuments(
			rows.map((row: Record<string, unknown>) => this.mapDocumentRow(row)),
		);
	}

	async findByProjectAndId(
		projectId: string,
		documentId: string,
	): Promise<DocumentRow | undefined> {
		const rows = await this.dataSource.query(
			`
				SELECT ${this.documentSelectColumnsSql()}
				${this.documentFromSql()}
				WHERE pr.id = $1
					AND d.id = $2
			`,
			[projectId, documentId],
		);

		if (!rows[0]) return undefined;

		const documents = await this.addTagsToDocuments([
			this.mapDocumentRow(rows[0]),
		]);
		return documents[0];
	}

	async findFileInfoByProjectAndId(
		projectId: string,
		documentId: string,
	): Promise<InternalFileInfo | undefined> {
		const rows = await this.dataSource.query(
			`
				SELECT d.file_info
				${this.documentFromSql()}
				WHERE pr.id = $1
					AND d.id = $2
			`,
			[projectId, documentId],
		);

		return rows[0]?.file_info;
	}

	async findDocumentTreeByProject(
		projectId: string,
	): Promise<DocumentTreeRow[]> {
		return this.dataSource.query(
			`
				SELECT
					p.id AS package_id,
					p.name AS package_name,
					pp.id AS parent_package_id,
					pp.name AS parent_package_name,
					COUNT(d.id)::int AS document_count,
					COUNT(d.id) FILTER (WHERE d.status = 'draft')::int AS draft_count,
					COUNT(d.id) FILTER (WHERE d.status = 'in_review')::int AS in_review_count,
					COUNT(d.id) FILTER (WHERE d.status = 'approved')::int AS approved_count,
					COUNT(d.id) FILTER (WHERE d.status = 'archived')::int AS archived_count
				FROM documents d
				JOIN packages p ON d.package_id = p.id
				JOIN projects pr ON p.project_id = pr.id
				LEFT JOIN packages pp ON p.parent_package_id = pp.id
				WHERE pr.id = $1
				GROUP BY
					p.id,
					p.name,
					pp.id,
					pp.name
				ORDER BY p.name
			`,
			[projectId],
		);
	}

	async projectExists(projectId: string): Promise<boolean> {
		const rows = await this.dataSource.query(
			"SELECT 1 FROM projects WHERE id = $1 LIMIT 1",
			[projectId],
		);

		return rows.length > 0;
	}

	async updateForProject(
		projectId: string,
		documentId: string,
		changes: UpdateDocumentChanges,
	): Promise<DocumentRow | undefined> {
		const setClauses: string[] = [];
		const values: unknown[] = [];

		this.addUpdateField(setClauses, values, "title", changes.title);
		this.addUpdateField(setClauses, values, "description", changes.description);
		this.addUpdateField(setClauses, values, "status", changes.status);
		this.addUpdateField(setClauses, values, "archived_at", changes.archivedAt);

		if (setClauses.length === 0) return undefined;

		values.push(changes.updatedAt ?? new Date().toISOString());
		setClauses.push(`updated_at = $${values.length}`);

		values.push(documentId);
		const documentIdParam = values.length;

		values.push(projectId);
		const projectIdParam = values.length;

		const rows = await this.dataSource.query(
			`
				UPDATE documents d
				SET ${setClauses.join(", ")}
				WHERE d.id = $${documentIdParam}
					AND EXISTS (
						SELECT 1
						FROM packages p
						JOIN projects pr ON p.project_id = pr.id
						WHERE p.id = d.package_id
							AND pr.id = $${projectIdParam}
					)
				RETURNING d.id
			`,
			values,
		);

		return rows[0] ? this.findByProjectAndId(projectId, documentId) : undefined;
	}

	private async addTagsToDocuments(
		documents: DocumentRow[],
	): Promise<DocumentRow[]> {
		if (documents.length === 0) return documents;

		const documentIds = documents.map((document) => document.id);
		const rows = await this.dataSource.query(
			`
				SELECT
					dt.document_id,
					dt.tag_name
				FROM document_tags dt
				WHERE dt.document_id = ANY($1::varchar[])
				ORDER BY dt.tag_name
			`,
			[documentIds],
		);

		const tagsByDocumentId = new Map<string, Array<{ name: string }>>();

		for (const row of rows) {
			if (!tagsByDocumentId.has(row.document_id)) {
				tagsByDocumentId.set(row.document_id, []);
			}

			tagsByDocumentId.get(row.document_id)?.push({ name: row.tag_name });
		}

		return documents.map((document) => ({
			...document,
			tags: tagsByDocumentId.get(document.id) ?? [],
		}));
	}

	private addTextSearchFilter(
		where: string[],
		params: unknown[],
		search?: string,
	) {
		if (!search) return;

		params.push(`%${search}%`);
		where.push(`(
			d.id ILIKE $${params.length}
			OR d.title ILIKE $${params.length}
			OR d.description ILIKE $${params.length}
			OR pr.name ILIKE $${params.length}
			OR p.name ILIKE $${params.length}
			OR o.name ILIKE $${params.length}
			OR EXISTS (
				SELECT 1
				FROM document_tags search_dt
				WHERE search_dt.document_id = d.id
					AND search_dt.tag_name ILIKE $${params.length}
			)
		)`);
	}

	private addTagFilter(where: string[], params: unknown[], tagName?: string) {
		if (!tagName) return;

		params.push(tagName);
		where.push(`EXISTS (
			SELECT 1
			FROM document_tags filter_dt
			WHERE filter_dt.document_id = d.id
				AND lower(filter_dt.tag_name) = lower($${params.length})
		)`);
	}

	private addPlainFilter(
		where: string[],
		params: unknown[],
		fieldName: string,
		value?: string,
	) {
		if (!value) return;

		params.push(value);
		where.push(`${fieldName} = $${params.length}`);
	}

	private addUpdateField(
		setClauses: string[],
		values: unknown[],
		columnName: string,
		value: unknown,
	) {
		if (value === undefined) return;

		values.push(value);
		setClauses.push(`${columnName} = $${values.length}`);
	}

	private mapDocumentRow(row: Record<string, unknown>): DocumentRow {
		return {
			id: String(row.id),
			title: String(row.title),
			description: row.description ? String(row.description) : undefined,
			status: row.status as DocumentStatus,
			project: {
				id: String(row.project_id),
				name: String(row.project_name),
			},
			package: {
				id: String(row.package_id),
				name: String(row.package_name),
			},
			parentPackage: row.parent_package_id
				? {
						id: String(row.parent_package_id),
						name: String(row.parent_package_name),
					}
				: null,
			owner: {
				id: String(row.owner_id),
				name: String(row.owner_name),
			},
			fileInfo: this.sanitizePublicFileInfo(
				row.file_info as InternalFileInfo | undefined,
			),
			version: Number(row.version),
			createdAt: this.toIsoString(row.created_at),
			updatedAt: row.updated_at ? this.toIsoString(row.updated_at) : null,
			archivedAt: row.archived_at ? this.toIsoString(row.archived_at) : null,
		};
	}

	private sanitizePublicFileInfo(
		fileInfo?: InternalFileInfo,
	): PublicFileInfo | undefined {
		if (!fileInfo) return undefined;

		return {
			fileName: fileInfo.fileName,
			mimeType: fileInfo.mimeType,
			sizeBytes: fileInfo.sizeBytes,
		};
	}

	private documentSelectColumnsSql() {
		return `
			d.id,
			d.title,
			d.description,
			d.status,
			d.file_info,
			d.version,
			d.created_at,
			d.updated_at,
			d.archived_at,
			o.id AS owner_id,
			o.name AS owner_name,
			pr.id AS project_id,
			pr.name AS project_name,
			p.id AS package_id,
			p.name AS package_name,
			pp.id AS parent_package_id,
			pp.name AS parent_package_name
		`;
	}

	private documentFromSql() {
		return `
			FROM documents d
			JOIN packages p ON d.package_id = p.id
			JOIN projects pr ON p.project_id = pr.id
			JOIN owners o ON d.owner_id = o.id
			LEFT JOIN packages pp ON p.parent_package_id = pp.id
		`;
	}

	private toIsoString(value: unknown) {
		if (value instanceof Date) return value.toISOString();

		return new Date(String(value)).toISOString();
	}
}
