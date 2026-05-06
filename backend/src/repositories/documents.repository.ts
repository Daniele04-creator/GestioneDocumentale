import { Injectable } from "@nestjs/common";
import { DataSource, type EntityManager } from "typeorm";
import type { DocumentStatus } from "../entities/document.entity";

export type DocumentFilters = {
	keyType: string;
	key: string;
	subKey?: string;
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
	keyType: string;
	key: { id: string; name: string };
	subKey: {
		id: string;
		name: string;
		parentSubKey: { id: string; name: string } | null;
	};
	owner: { id: string; name: string };
	fileInfo?: PublicFileInfo;
	version: number;
	createdAt: string;
	updatedAt: string | null;
	archivedAt: string | null;
	tags?: Array<{ name: string }>;
};

export type DocumentTreeRow = {
	key_type: string;
	key_value: string;
	key_name: string;
	sub_key: string;
	sub_key_name: string;
	parent_sub_key: string | null;
	parent_sub_key_name: string | null;
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

export type CreateDocumentInput = {
	subKey: string;
	title: string;
	description?: string;
	ownerId: string;
	status: Exclude<DocumentStatus, "archived">;
	fileInfo: InternalFileInfo;
	tags: string[];
	createdAt: string;
};

@Injectable()
export class DocumentsRepository {
	constructor(private readonly dataSource: DataSource) {}

	async findAll(filters: DocumentFilters): Promise<DocumentRow[]> {
		const where: string[] = [];
		const params: unknown[] = [];

		this.addTextSearchFilter(where, params, filters.search);
		this.addPlainFilter(where, params, "d.key_type", filters.keyType);
		this.addPlainFilter(where, params, "d.key_value", filters.key);
		this.addPlainFilter(where, params, "d.sub_key", filters.subKey);
		this.addPlainFilter(where, params, "d.status", filters.status);
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

	async findByKeyAndId(
		keyType: string,
		key: string,
		documentId: string,
	): Promise<DocumentRow | undefined> {
		const rows = await this.dataSource.query(
			`
				SELECT ${this.documentSelectColumnsSql()}
				${this.documentFromSql()}
				WHERE d.key_type = $1
					AND d.key_value = $2
					AND d.id = $3
			`,
			[keyType, key, documentId],
		);

		if (!rows[0]) return undefined;

		const documents = await this.addTagsToDocuments([
			this.mapDocumentRow(rows[0]),
		]);
		return documents[0];
	}

	async findFileInfoByKeyAndId(
		keyType: string,
		key: string,
		documentId: string,
	): Promise<InternalFileInfo | undefined> {
		const rows = await this.dataSource.query(
			`
				SELECT d.file_info
				${this.documentFromSql()}
				WHERE d.key_type = $1
					AND d.key_value = $2
					AND d.id = $3
			`,
			[keyType, key, documentId],
		);

		return rows[0]?.file_info;
	}

	async findDocumentTreeByKey(
		keyType: string,
		key: string,
	): Promise<DocumentTreeRow[]> {
		return this.dataSource.query(
			`
				SELECT
					ds.key_type,
					ds.key_value,
					dk.name AS key_name,
					ds.sub_key,
					ds.name AS sub_key_name,
					ds.parent_sub_key,
					parent_ds.name AS parent_sub_key_name,
					COUNT(d.id)::int AS document_count,
					COUNT(d.id) FILTER (WHERE d.status = 'draft')::int AS draft_count,
					COUNT(d.id) FILTER (WHERE d.status = 'in_review')::int AS in_review_count,
					COUNT(d.id) FILTER (WHERE d.status = 'approved')::int AS approved_count,
					COUNT(d.id) FILTER (WHERE d.status = 'archived')::int AS archived_count
				FROM documents d
				JOIN document_sub_keys ds
					ON ds.key_type = d.key_type
					AND ds.key_value = d.key_value
					AND ds.sub_key = d.sub_key
				JOIN document_keys dk
					ON dk.key_type = ds.key_type
					AND dk.key_value = ds.key_value
				LEFT JOIN document_sub_keys parent_ds
					ON parent_ds.key_type = ds.key_type
					AND parent_ds.key_value = ds.key_value
					AND parent_ds.sub_key = ds.parent_sub_key
				WHERE ds.key_type = $1
					AND ds.key_value = $2
				GROUP BY
					ds.key_type,
					ds.key_value,
					dk.name,
					ds.sub_key,
					ds.name,
					ds.parent_sub_key,
					parent_ds.name
				ORDER BY ds.name
			`,
			[keyType, key],
		);
	}

	async keyExists(keyType: string, key: string): Promise<boolean> {
		const rows = await this.dataSource.query(
			"SELECT 1 FROM document_keys WHERE key_type = $1 AND key_value = $2 LIMIT 1",
			[keyType, key],
		);

		return rows.length > 0;
	}

	async subKeyExists(
		keyType: string,
		key: string,
		subKey: string,
	): Promise<boolean> {
		const rows = await this.dataSource.query(
			`
				SELECT 1
				FROM document_sub_keys
				WHERE key_type = $1
					AND key_value = $2
					AND sub_key = $3
				LIMIT 1
			`,
			[keyType, key, subKey],
		);

		return rows.length > 0;
	}

	async ownerExists(ownerId: string): Promise<boolean> {
		const rows = await this.dataSource.query(
			"SELECT 1 FROM owners WHERE id = $1 LIMIT 1",
			[ownerId],
		);

		return rows.length > 0;
	}

	async createForKey(
		keyType: string,
		key: string,
		input: CreateDocumentInput,
	): Promise<DocumentRow | undefined> {
		const documentId = await this.dataSource.transaction(async (manager) => {
			const nextDocumentId = await this.nextDocumentId(manager);

			await manager.query(
				`
					INSERT INTO documents (
						id,
						key_type,
						key_value,
						sub_key,
						owner_id,
						title,
						description,
						status,
						file_info,
						version,
						created_at,
						updated_at,
						archived_at
					)
					VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, 1, $10, NULL, NULL)
				`,
				[
					nextDocumentId,
					keyType,
					key,
					input.subKey,
					input.ownerId,
					input.title,
					input.description ?? null,
					input.status,
					JSON.stringify(input.fileInfo),
					input.createdAt,
				],
			);

			for (const tag of input.tags) {
				await manager.query(
					`
						INSERT INTO tags (name)
						SELECT $1::varchar
						WHERE NOT EXISTS (
							SELECT 1 FROM tags WHERE lower(name) = lower($1::varchar)
						)
					`,
					[tag],
				);
				const tagRows = await manager.query(
					"SELECT name FROM tags WHERE lower(name) = lower($1::varchar) LIMIT 1",
					[tag],
				);
				const tagName = String(tagRows[0]?.name ?? tag);

				await manager.query(
					`
						INSERT INTO document_tags (document_id, tag_name)
						VALUES ($1, $2)
						ON CONFLICT DO NOTHING
					`,
					[nextDocumentId, tagName],
				);
			}

			return nextDocumentId;
		});

		return this.findByKeyAndId(keyType, key, documentId);
	}

	async updateForKey(
		keyType: string,
		key: string,
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

		values.push(keyType);
		const keyTypeParam = values.length;

		values.push(key);
		const keyParam = values.length;

		const rows = await this.dataSource.query(
			`
				UPDATE documents d
				SET ${setClauses.join(", ")}
				WHERE d.id = $${documentIdParam}
					AND d.key_type = $${keyTypeParam}
					AND d.key_value = $${keyParam}
				RETURNING d.id
			`,
			values,
		);

		return rows[0] ? this.findByKeyAndId(keyType, key, documentId) : undefined;
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
			OR d.key_type ILIKE $${params.length}
			OR d.key_value ILIKE $${params.length}
			OR d.sub_key ILIKE $${params.length}
			OR dk.name ILIKE $${params.length}
			OR ds.name ILIKE $${params.length}
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

	private async nextDocumentId(manager: EntityManager) {
		const rows = await manager.query(
			`
				SELECT COALESCE(MAX((substring(id FROM 5))::int), 0)::int AS max_id
				FROM documents
				WHERE id ~ '^DOC-[0-9]{3}$'
			`,
		);

		const nextNumber = Number(rows[0]?.max_id ?? 0) + 1;
		return `DOC-${String(nextNumber).padStart(3, "0")}`;
	}

	private mapDocumentRow(row: Record<string, unknown>): DocumentRow {
		return {
			id: String(row.id),
			title: String(row.title),
			description: row.description ? String(row.description) : undefined,
			status: row.status as DocumentStatus,
			keyType: String(row.key_type),
			key: {
				id: String(row.key_value),
				name: String(row.key_name),
			},
			subKey: {
				id: String(row.sub_key),
				name: String(row.sub_key_name),
				parentSubKey: row.parent_sub_key
					? {
							id: String(row.parent_sub_key),
							name: String(row.parent_sub_key_name),
						}
					: null,
			},
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
			d.key_type,
			d.key_value,
			dk.name AS key_name,
			d.sub_key,
			ds.name AS sub_key_name,
			parent_ds.sub_key AS parent_sub_key,
			parent_ds.name AS parent_sub_key_name
		`;
	}

	private documentFromSql() {
		return `
			FROM documents d
			JOIN document_sub_keys ds
				ON ds.key_type = d.key_type
				AND ds.key_value = d.key_value
				AND ds.sub_key = d.sub_key
			JOIN document_keys dk
				ON dk.key_type = ds.key_type
				AND dk.key_value = ds.key_value
			JOIN owners o ON d.owner_id = o.id
			LEFT JOIN document_sub_keys parent_ds
				ON parent_ds.key_type = ds.key_type
				AND parent_ds.key_value = ds.key_value
				AND parent_ds.sub_key = ds.parent_sub_key
		`;
	}

	private toIsoString(value: unknown) {
		if (value instanceof Date) return value.toISOString();

		return new Date(String(value)).toISOString();
	}
}
