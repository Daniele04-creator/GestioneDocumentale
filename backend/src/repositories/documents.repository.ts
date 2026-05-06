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

export type DocumentVersionRow = {
	documentId: string;
	version: number;
	fileInfo: PublicFileInfo;
	checksumSha256: string;
	createdAt: string;
};

export type DocumentRow = {
	id: string;
	documentKey: string;
	templateId: string | null;
	templateName: string | null;
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
	checksumSha256: string;
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
	documentKey: string;
	templateId?: string;
	templateName?: string;
	title: string;
	description?: string;
	ownerId: string;
	status?: Exclude<DocumentStatus, "archived">;
	fileInfo: InternalFileInfo;
	checksumSha256: string;
	tags?: string[];
	createdAt: string;
};

export type UpsertGeneratedDocumentResult = {
	document?: DocumentRow;
	storedFileUsed: boolean;
};

type ExistingLogicalDocumentRow = {
	id: string;
	version: number;
	status: DocumentStatus;
	checksum_sha256: string;
};

type UpdateGeneratedDocumentFields = {
	title: string;
	description?: string;
	ownerId: string;
	status?: Exclude<DocumentStatus, "archived">;
	templateId?: string;
	templateName?: string;
	updatedAt: string;
};

type UpdateGeneratedDocumentVersionFields = UpdateGeneratedDocumentFields & {
	version: number;
	fileInfo: InternalFileInfo;
	checksumSha256: string;
};

type InsertDocumentVersionInput = {
	documentId: string;
	version: number;
	fileInfo: InternalFileInfo;
	checksumSha256: string;
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

	async findByLogicalKey(
		keyType: string,
		key: string,
		subKey: string,
		documentKey: string,
	): Promise<DocumentRow | undefined> {
		const rows = await this.dataSource.query(
			`
				SELECT ${this.documentSelectColumnsSql()}
				${this.documentFromSql()}
				WHERE d.key_type = $1
					AND d.key_value = $2
					AND d.sub_key = $3
					AND d.document_key = $4
			`,
			[keyType, key, subKey, documentKey],
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

	async findVersionsByKeyAndId(
		keyType: string,
		key: string,
		documentId: string,
	): Promise<DocumentVersionRow[]> {
		const rows = await this.dataSource.query(
			`
				SELECT
					dv.document_id,
					dv.version,
					dv.file_info,
					dv.checksum_sha256,
					dv.created_at
				FROM document_versions dv
				JOIN documents d ON d.id = dv.document_id
				WHERE d.key_type = $1
					AND d.key_value = $2
					AND d.id = $3
				ORDER BY dv.version
			`,
			[keyType, key, documentId],
		);

		return rows.map((row: Record<string, unknown>) =>
			this.mapDocumentVersionRow(row),
		);
	}

	async findVersionFileInfoByKeyAndId(
		keyType: string,
		key: string,
		documentId: string,
		version: number,
	): Promise<InternalFileInfo | undefined> {
		const rows = await this.dataSource.query(
			`
				SELECT dv.file_info
				FROM document_versions dv
				JOIN documents d ON d.id = dv.document_id
				WHERE d.key_type = $1
					AND d.key_value = $2
					AND d.id = $3
					AND dv.version = $4
			`,
			[keyType, key, documentId, version],
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

	async upsertGeneratedDocument(
		keyType: string,
		key: string,
		input: CreateDocumentInput,
	): Promise<UpsertGeneratedDocumentResult> {
		const result = await this.dataSource.transaction(async (manager) => {
			await this.lockLogicalDocumentKey(manager, keyType, key, input);

			const existingDocument = await this.findExistingLogicalDocumentForUpdate(
				manager,
				keyType,
				key,
				input,
			);

			if (existingDocument) {
				const updatedAt = new Date().toISOString();

				if (existingDocument.checksum_sha256 === input.checksumSha256) {
					await this.updateGeneratedDocumentMetadata(
						manager,
						existingDocument.id,
						{
							title: input.title,
							description: input.description,
							ownerId: input.ownerId,
							status: input.status,
							templateId: input.templateId,
							templateName: input.templateName,
							updatedAt,
						},
					);
					await this.syncDocumentTagsIfNeeded(
						manager,
						existingDocument.id,
						input.tags,
					);

					return {
						documentId: existingDocument.id,
						storedFileUsed: false,
					};
				}

				const nextVersion = Number(existingDocument.version) + 1;
				await this.updateGeneratedDocumentVersion(
					manager,
					existingDocument.id,
					{
						title: input.title,
						description: input.description,
						ownerId: input.ownerId,
						status: input.status,
						templateId: input.templateId,
						templateName: input.templateName,
						version: nextVersion,
						fileInfo: input.fileInfo,
						checksumSha256: input.checksumSha256,
						updatedAt,
					},
				);
				await this.insertDocumentVersion(manager, {
					documentId: existingDocument.id,
					version: nextVersion,
					fileInfo: input.fileInfo,
					checksumSha256: input.checksumSha256,
					createdAt: updatedAt,
				});
				await this.syncDocumentTagsIfNeeded(
					manager,
					existingDocument.id,
					input.tags,
				);

				return {
					documentId: existingDocument.id,
					storedFileUsed: true,
				};
			}

			const nextDocumentId = await this.nextDocumentId(manager);
			const createdAt = input.createdAt;

			await manager.query(
				`
					INSERT INTO documents (
						id,
						key_type,
						key_value,
						sub_key,
						document_key,
						template_id,
						template_name,
						owner_id,
						title,
						description,
						status,
						file_info,
						checksum_sha256,
						version,
						created_at,
						updated_at,
						archived_at
					)
					VALUES (
						$1,
						$2,
						$3,
						$4,
						$5,
						$6,
						$7,
						$8,
						$9,
						$10,
						$11,
						$12::jsonb,
						$13,
						1,
						$14,
						NULL,
						NULL
					)
				`,
				[
					nextDocumentId,
					keyType,
					key,
					input.subKey,
					input.documentKey,
					input.templateId ?? null,
					input.templateName ?? null,
					input.ownerId,
					input.title,
					input.description ?? null,
					input.status ?? "draft",
					JSON.stringify(input.fileInfo),
					input.checksumSha256,
					createdAt,
				],
			);

			await this.insertDocumentVersion(manager, {
				documentId: nextDocumentId,
				version: 1,
				fileInfo: input.fileInfo,
				checksumSha256: input.checksumSha256,
				createdAt,
			});
			await this.syncDocumentTags(manager, nextDocumentId, input.tags ?? []);

			return {
				documentId: nextDocumentId,
				storedFileUsed: true,
			};
		});

		return {
			document: await this.findByKeyAndId(keyType, key, result.documentId),
			storedFileUsed: result.storedFileUsed,
		};
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

	private async lockLogicalDocumentKey(
		manager: EntityManager,
		keyType: string,
		key: string,
		input: CreateDocumentInput,
	) {
		await manager.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
			`${keyType}:${key}:${input.subKey}:${input.documentKey}`,
		]);
	}

	private async findExistingLogicalDocumentForUpdate(
		manager: EntityManager,
		keyType: string,
		key: string,
		input: CreateDocumentInput,
	): Promise<ExistingLogicalDocumentRow | undefined> {
		const rows = await manager.query(
			`
				SELECT id, version, status, checksum_sha256
				FROM documents
				WHERE key_type = $1
					AND key_value = $2
					AND sub_key = $3
					AND document_key = $4
				FOR UPDATE
			`,
			[keyType, key, input.subKey, input.documentKey],
		);

		return rows[0];
	}

	private async updateGeneratedDocumentMetadata(
		manager: EntityManager,
		documentId: string,
		input: UpdateGeneratedDocumentFields,
	) {
		const setClauses = ["title = $1", "owner_id = $2", "updated_at = $3"];
		const values: unknown[] = [input.title, input.ownerId, input.updatedAt];

		this.addOptionalGeneratedField(
			setClauses,
			values,
			"description",
			input.description,
		);
		this.addOptionalGeneratedField(
			setClauses,
			values,
			"template_id",
			input.templateId,
		);
		this.addOptionalGeneratedField(
			setClauses,
			values,
			"template_name",
			input.templateName,
		);

		if (input.status !== undefined) {
			values.push(input.status);
			setClauses.push(`status = $${values.length}`);
			setClauses.push("archived_at = NULL");
		}

		values.push(documentId);
		await manager.query(
			`
				UPDATE documents
				SET ${setClauses.join(", ")}
				WHERE id = $${values.length}
			`,
			values,
		);
	}

	private async updateGeneratedDocumentVersion(
		manager: EntityManager,
		documentId: string,
		input: UpdateGeneratedDocumentVersionFields,
	) {
		const setClauses = [
			"title = $1",
			"owner_id = $2",
			"version = $3",
			"file_info = $4::jsonb",
			"checksum_sha256 = $5",
			"updated_at = $6",
		];
		const values: unknown[] = [
			input.title,
			input.ownerId,
			input.version,
			JSON.stringify(input.fileInfo),
			input.checksumSha256,
			input.updatedAt,
		];

		this.addOptionalGeneratedField(
			setClauses,
			values,
			"description",
			input.description,
		);
		this.addOptionalGeneratedField(
			setClauses,
			values,
			"template_id",
			input.templateId,
		);
		this.addOptionalGeneratedField(
			setClauses,
			values,
			"template_name",
			input.templateName,
		);

		if (input.status !== undefined) {
			values.push(input.status);
			setClauses.push(`status = $${values.length}`);
			setClauses.push("archived_at = NULL");
		}

		values.push(documentId);
		await manager.query(
			`
				UPDATE documents
				SET ${setClauses.join(", ")}
				WHERE id = $${values.length}
			`,
			values,
		);
	}

	private addOptionalGeneratedField(
		setClauses: string[],
		values: unknown[],
		columnName: string,
		value: string | undefined,
	) {
		if (value === undefined) return;

		values.push(value === "" ? null : value);
		setClauses.push(`${columnName} = $${values.length}`);
	}

	private async insertDocumentVersion(
		manager: EntityManager,
		input: InsertDocumentVersionInput,
	) {
		await manager.query(
			`
				INSERT INTO document_versions (
					document_id,
					version,
					file_info,
					checksum_sha256,
					created_at
				)
				VALUES ($1, $2, $3::jsonb, $4, $5)
			`,
			[
				input.documentId,
				input.version,
				JSON.stringify(input.fileInfo),
				input.checksumSha256,
				input.createdAt,
			],
		);
	}

	private async syncDocumentTagsIfNeeded(
		manager: EntityManager,
		documentId: string,
		tags?: string[],
	) {
		if (tags === undefined) return;

		await this.syncDocumentTags(manager, documentId, tags);
	}

	private async syncDocumentTags(
		manager: EntityManager,
		documentId: string,
		tags: string[],
	) {
		await manager.query("DELETE FROM document_tags WHERE document_id = $1", [
			documentId,
		]);

		for (const tag of tags) {
			const tagName = await this.ensureTag(manager, tag);
			await manager.query(
				`
					INSERT INTO document_tags (document_id, tag_name)
					VALUES ($1, $2)
					ON CONFLICT DO NOTHING
				`,
				[documentId, tagName],
			);
		}
	}

	private async ensureTag(manager: EntityManager, tag: string) {
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

		return String(tagRows[0]?.name ?? tag);
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
			OR d.document_key ILIKE $${params.length}
			OR d.template_id ILIKE $${params.length}
			OR d.template_name ILIKE $${params.length}
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
				SELECT nextval('document_id_seq')::int AS next_id
			`,
		);

		const nextNumber = Number(rows[0]?.next_id);
		return `DOC-${String(nextNumber).padStart(3, "0")}`;
	}

	private mapDocumentRow(row: Record<string, unknown>): DocumentRow {
		return {
			id: String(row.id),
			documentKey: String(row.document_key),
			templateId: row.template_id ? String(row.template_id) : null,
			templateName: row.template_name ? String(row.template_name) : null,
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
			checksumSha256: String(row.checksum_sha256),
			version: Number(row.version),
			createdAt: this.toIsoString(row.created_at),
			updatedAt: row.updated_at ? this.toIsoString(row.updated_at) : null,
			archivedAt: row.archived_at ? this.toIsoString(row.archived_at) : null,
		};
	}

	private mapDocumentVersionRow(
		row: Record<string, unknown>,
	): DocumentVersionRow {
		return {
			documentId: String(row.document_id),
			version: Number(row.version),
			fileInfo: this.sanitizePublicFileInfo(
				row.file_info as InternalFileInfo | undefined,
			) as PublicFileInfo,
			checksumSha256: String(row.checksum_sha256),
			createdAt: this.toIsoString(row.created_at),
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
			d.document_key,
			d.template_id,
			d.template_name,
			d.title,
			d.description,
			d.status,
			d.file_info,
			d.checksum_sha256,
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
