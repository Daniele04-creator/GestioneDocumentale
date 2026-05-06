import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { Injectable } from "@nestjs/common";
import {
	documentArchived,
	documentFileNotFound,
	documentNotFound,
	invalidDocumentFile,
	invalidDocumentId,
	invalidDocumentPatch,
	invalidQueryParam,
	keyNotFound,
	ownerNotFound,
	subKeyNotFound,
} from "../common/errors/document-errors";
import { PROJECT_ROOT, STORAGE_ROOT } from "../common/utils/paths";
import {
	CREATE_DOCUMENT_STATUS_VALUES,
	type CreateDocumentDto,
} from "../dto/create-document.dto";
import { DOCUMENT_STATUS_VALUES } from "../dto/document-query.dto";
import type { UpdateDocumentDto } from "../dto/update-document.dto";
import type { DocumentStatus } from "../entities/document.entity";
import {
	type CreateDocumentInput,
	type DocumentRow,
	DocumentsRepository,
	type DocumentTreeRow,
} from "../repositories/documents.repository";

type StatusSummary = Record<DocumentStatus, number>;
const QUERY_FIELDS = new Set(["subKey", "ownerId", "tag", "status", "search"]);
type DocumentListItem = Pick<
	DocumentRow,
	| "id"
	| "documentKey"
	| "templateId"
	| "templateName"
	| "title"
	| "description"
	| "status"
	| "version"
	| "checksumSha256"
	| "updatedAt"
	| "owner"
	| "tags"
>;

type DocumentSubKeyGroup = {
	keyType: string;
	key: DocumentRow["key"];
	subKey: DocumentRow["subKey"];
	documentCount: number;
	statusSummary: StatusSummary;
	documents: DocumentListItem[];
};

type DocumentTreeSubKey = {
	keyType: string;
	key: DocumentRow["key"];
	subKey: DocumentRow["subKey"];
	documentCount: number;
	statusSummary: StatusSummary;
};

type UploadedDocumentFile = {
	originalname?: string;
	mimetype?: string;
	size?: number;
	buffer?: Buffer;
};

type StoredDocumentFile = {
	absolutePath: string;
	fileInfo: {
		fileName: string;
		mimeType: string;
		sizeBytes: number;
		storagePath: string;
	};
	checksumSha256: string;
};

@Injectable()
export class DocumentsService {
	constructor(private readonly documentsRepository: DocumentsRepository) {}

	async getDocuments(
		keyType: string,
		key: string,
		query: Record<string, unknown>,
	) {
		const validKeyType = this.validateKeyType(keyType);
		const validKey = this.validateKey(key);
		const filters = this.normalizeQuery(query);
		await this.ensureKeyExists(validKeyType, validKey);

		const documents = await this.documentsRepository.findAll({
			...filters,
			keyType: validKeyType,
			key: validKey,
		});

		return this.buildGroupedDocumentsResponse(documents);
	}

	async getDocumentTree(keyType: string, key: string) {
		const validKeyType = this.validateKeyType(keyType);
		const validKey = this.validateKey(key);
		await this.ensureKeyExists(validKeyType, validKey);

		const rows = await this.documentsRepository.findDocumentTreeByKey(
			validKeyType,
			validKey,
		);
		return this.buildDocumentTreeResponse(rows);
	}

	async createDocument(
		keyType: string,
		key: string,
		body: CreateDocumentDto,
		file?: UploadedDocumentFile,
	) {
		const validKeyType = this.validateKeyType(keyType);
		const validKey = this.validateKey(key);
		const payload = this.normalizeCreatePayload(body);
		await this.ensureKeyExists(validKeyType, validKey);

		const subKeyExists = await this.documentsRepository.subKeyExists(
			validKeyType,
			validKey,
			payload.subKey,
		);
		if (!subKeyExists) throw subKeyNotFound();

		const ownerExists = await this.documentsRepository.ownerExists(
			payload.ownerId,
		);
		if (!ownerExists) throw ownerNotFound();

		const storedFile = await this.storeUploadedDocumentFile(file);

		let result:
			| Awaited<ReturnType<DocumentsRepository["upsertGeneratedDocument"]>>
			| undefined;
		try {
			result = await this.documentsRepository.upsertGeneratedDocument(
				validKeyType,
				validKey,
				{
					...payload,
					fileInfo: storedFile.fileInfo,
					checksumSha256: storedFile.checksumSha256,
				},
			);
		} catch (error) {
			await fs.unlink(storedFile.absolutePath).catch(() => undefined);
			throw error;
		}

		if (!result?.storedFileUsed) {
			await fs.unlink(storedFile.absolutePath).catch(() => undefined);
		}

		if (!result?.document) throw documentNotFound();

		return result.document;
	}

	async getDocumentById(keyType: string, key: string, documentId: string) {
		const validKeyType = this.validateKeyType(keyType);
		const validKey = this.validateKey(key);
		const validDocumentId = this.validateDocumentId(documentId);
		await this.ensureKeyExists(validKeyType, validKey);

		const document = await this.documentsRepository.findByKeyAndId(
			validKeyType,
			validKey,
			validDocumentId,
		);

		if (!document) throw documentNotFound();

		return document;
	}

	async getDocumentFile(keyType: string, key: string, documentId: string) {
		const validKeyType = this.validateKeyType(keyType);
		const validKey = this.validateKey(key);
		const validDocumentId = this.validateDocumentId(documentId);
		await this.ensureKeyExists(validKeyType, validKey);

		const fileInfo = await this.documentsRepository.findFileInfoByKeyAndId(
			validKeyType,
			validKey,
			validDocumentId,
		);

		if (!fileInfo) throw documentNotFound();
		if (!fileInfo.storagePath) throw documentFileNotFound();

		const absolutePath = this.resolveStoragePath(fileInfo.storagePath);
		const fileExists = await this.isExistingFile(absolutePath);

		if (!fileExists) throw documentFileNotFound();

		return {
			absolutePath,
			fileName: fileInfo.fileName || path.basename(absolutePath),
			mimeType: fileInfo.mimeType || "application/octet-stream",
		};
	}

	async getDocumentVersions(keyType: string, key: string, documentId: string) {
		const validKeyType = this.validateKeyType(keyType);
		const validKey = this.validateKey(key);
		const validDocumentId = this.validateDocumentId(documentId);
		await this.ensureKeyExists(validKeyType, validKey);

		const document = await this.documentsRepository.findByKeyAndId(
			validKeyType,
			validKey,
			validDocumentId,
		);
		if (!document) throw documentNotFound();

		const versions = await this.documentsRepository.findVersionsByKeyAndId(
			validKeyType,
			validKey,
			validDocumentId,
		);

		return { data: versions };
	}

	async getDocumentVersionFile(
		keyType: string,
		key: string,
		documentId: string,
		version: string,
	) {
		const validKeyType = this.validateKeyType(keyType);
		const validKey = this.validateKey(key);
		const validDocumentId = this.validateDocumentId(documentId);
		const validVersion = this.validateVersion(version);
		await this.ensureKeyExists(validKeyType, validKey);

		const fileInfo =
			await this.documentsRepository.findVersionFileInfoByKeyAndId(
				validKeyType,
				validKey,
				validDocumentId,
				validVersion,
			);

		if (!fileInfo) throw documentNotFound();
		if (!fileInfo.storagePath) throw documentFileNotFound();

		const absolutePath = this.resolveStoragePath(fileInfo.storagePath);
		const fileExists = await this.isExistingFile(absolutePath);

		if (!fileExists) throw documentFileNotFound();

		return {
			absolutePath,
			fileName: fileInfo.fileName || path.basename(absolutePath),
			mimeType: fileInfo.mimeType || "application/octet-stream",
		};
	}

	async updateDocument(
		keyType: string,
		key: string,
		documentId: string,
		body: UpdateDocumentDto,
	) {
		const payload = this.normalizeUpdatePayload(body);
		const document = await this.getDocumentById(keyType, key, documentId);

		if (document.status === "archived") throw documentArchived();

		const updatedDocument = await this.documentsRepository.updateForKey(
			keyType,
			key,
			documentId,
			{
				...payload,
				updatedAt: new Date().toISOString(),
			},
		);

		if (!updatedDocument) throw documentNotFound();

		return updatedDocument;
	}

	async archiveDocument(keyType: string, key: string, documentId: string) {
		await this.getDocumentById(keyType, key, documentId);

		const now = new Date().toISOString();
		const archivedDocument = await this.documentsRepository.updateForKey(
			keyType,
			key,
			documentId,
			{
				status: "archived",
				archivedAt: now,
				updatedAt: now,
			},
		);

		if (!archivedDocument) throw documentNotFound();

		return archivedDocument;
	}

	private async ensureKeyExists(keyType: string, key: string) {
		const exists = await this.documentsRepository.keyExists(keyType, key);

		if (!exists) throw keyNotFound();
	}

	private validateKeyType(keyType: string) {
		if (typeof keyType !== "string" || keyType.trim() === "") {
			throw invalidQueryParam("Invalid key type.");
		}

		return keyType.trim();
	}

	private validateKey(key: string) {
		if (typeof key !== "string" || key.trim() === "") {
			throw invalidQueryParam("Invalid key.");
		}

		return key.trim();
	}

	private validateDocumentId(documentId: string) {
		if (typeof documentId !== "string" || !/^DOC-[0-9]{3,}$/.test(documentId)) {
			throw invalidDocumentId();
		}

		return documentId;
	}

	private validateVersion(version: string) {
		const parsedVersion = Number(version);

		if (!Number.isInteger(parsedVersion) || parsedVersion < 1) {
			throw invalidQueryParam("Invalid document version.");
		}

		return parsedVersion;
	}

	private normalizeQuery(query: Record<string, unknown>) {
		for (const field of Object.keys(query)) {
			if (!QUERY_FIELDS.has(field)) throw invalidQueryParam();
		}

		const status = this.optionalStatus(query.status);

		return {
			subKey: this.optionalQueryString(query.subKey, "subKey"),
			ownerId: this.optionalQueryString(query.ownerId, "ownerId"),
			tag: this.optionalQueryString(query.tag, "tag"),
			status,
			search: this.optionalQueryString(query.search, "search", true),
		};
	}

	private optionalStatus(value: unknown) {
		if (value === undefined) return undefined;

		if (
			typeof value !== "string" ||
			!DOCUMENT_STATUS_VALUES.includes(value as DocumentStatus)
		) {
			throw invalidQueryParam();
		}

		return value as DocumentStatus;
	}

	private optionalQueryString(
		value: unknown,
		field: string,
		allowEmpty = false,
	) {
		if (value === undefined) return undefined;
		if (typeof value !== "string")
			throw invalidQueryParam(`${field} must be a string`);

		const trimmedValue = value.trim();

		if (!allowEmpty && trimmedValue === "") {
			throw invalidQueryParam(`${field} must be a non-empty string`);
		}

		return trimmedValue === "" ? undefined : trimmedValue;
	}

	private normalizeUpdatePayload(body: UpdateDocumentDto) {
		const payload: UpdateDocumentDto = {};

		if (body.title !== undefined) {
			const trimmedTitle = body.title.trim();
			if (trimmedTitle === "")
				throw invalidDocumentPatch("title must be a non-empty string");
			payload.title = trimmedTitle;
		}

		if (body.description !== undefined) payload.description = body.description;
		if (body.status !== undefined) payload.status = body.status;

		if (Object.keys(payload).length === 0) {
			throw invalidDocumentPatch(
				"Request body must contain at least one field",
			);
		}

		return payload;
	}

	private normalizeCreatePayload(
		body: CreateDocumentDto,
	): Omit<CreateDocumentInput, "fileInfo" | "checksumSha256"> {
		const subKey = body.subKey.trim();
		const documentKey = body.documentKey.trim();
		const title = body.title.trim();
		const ownerId = body.ownerId.trim();
		const status = body.status;
		const templateId = body.templateId?.trim();
		const templateName = body.templateName?.trim();

		if (subKey === "") throw invalidDocumentPatch("subKey is required");
		if (documentKey === "")
			throw invalidDocumentPatch("documentKey is required");
		if (title === "") throw invalidDocumentPatch("title is required");
		if (ownerId === "") throw invalidDocumentPatch("ownerId is required");

		if (
			status !== undefined &&
			!CREATE_DOCUMENT_STATUS_VALUES.includes(status)
		) {
			throw invalidDocumentPatch("status is not valid for document creation");
		}

		const tags =
			body.tags === undefined
				? undefined
				: Array.from(
						new Set(
							body.tags
								.map((tag) => tag.trim())
								.filter((tag) => tag.length > 0),
						),
					);

		return {
			subKey,
			documentKey,
			templateId: templateId === "" ? undefined : templateId,
			templateName: templateName === "" ? undefined : templateName,
			title,
			description: body.description,
			ownerId,
			status,
			tags,
			createdAt: new Date().toISOString(),
		};
	}

	private async storeUploadedDocumentFile(
		file?: UploadedDocumentFile,
	): Promise<StoredDocumentFile> {
		if (!file?.buffer || file.size === undefined) {
			throw invalidDocumentFile("Document file is required.");
		}

		const fileName = await this.safeStoredFileName(file.originalname);
		const storagePath = `storage/documents/${fileName}`;
		const absolutePath = this.resolveStoragePath(storagePath, true);
		const checksumSha256 = createHash("sha256")
			.update(file.buffer)
			.digest("hex");

		await fs.mkdir(STORAGE_ROOT, { recursive: true });
		await fs
			.writeFile(absolutePath, file.buffer, { flag: "wx" })
			.catch((error) => {
				if (error?.code === "EEXIST") {
					throw invalidDocumentFile(
						"Generated document file name already exists.",
					);
				}
				throw error;
			});

		return {
			absolutePath,
			fileInfo: {
				fileName,
				mimeType: file.mimetype || "application/octet-stream",
				sizeBytes: file.size,
				storagePath,
			},
			checksumSha256,
		};
	}

	private async safeStoredFileName(originalName?: string) {
		const safeOriginalName = this.safeOriginalFileName(originalName);

		for (let attempt = 0; attempt < 5; attempt += 1) {
			const fileName = `uploaded-${Date.now()}-${randomUUID()}-${safeOriginalName}`;
			const absolutePath = this.resolveStoragePath(
				`storage/documents/${fileName}`,
				true,
			);

			if (!(await this.isExistingFile(absolutePath))) return fileName;
		}

		throw invalidDocumentFile("Unable to generate a safe document file name.");
	}

	private safeOriginalFileName(originalName?: string) {
		const fallbackName = "document";
		const parsedName = path.parse(originalName || fallbackName);
		const baseName = (parsedName.name || fallbackName)
			.normalize("NFKD")
			.replace(/[^a-zA-Z0-9._-]/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "")
			.slice(0, 80);
		const extension = parsedName.ext
			.toLowerCase()
			.replace(/[^a-z0-9.]/g, "")
			.slice(0, 20);

		return `${baseName || fallbackName}${extension}`;
	}

	private buildGroupedDocumentsResponse(documents: DocumentRow[]) {
		const subKeys = this.groupDocumentsBySubKey(documents);

		return {
			data: subKeys,
			meta: {
				totalSubKeys: subKeys.length,
				totalDocuments: subKeys.reduce(
					(total, subKey) => total + subKey.documentCount,
					0,
				),
			},
		};
	}

	private buildDocumentTreeResponse(rows: DocumentTreeRow[]) {
		const subKeys = this.groupDocumentTreeRows(rows);

		return {
			data: subKeys,
			meta: {
				totalSubKeys: subKeys.length,
				totalDocuments: subKeys.reduce(
					(total, subKey) => total + subKey.documentCount,
					0,
				),
			},
		};
	}

	private groupDocumentsBySubKey(documents: DocumentRow[]) {
		const subKeysById = new Map<string, DocumentSubKeyGroup>();

		for (const document of documents) {
			const groupKey = `${document.keyType}:${document.key.id}:${document.subKey.id}`;

			if (!subKeysById.has(groupKey)) {
				subKeysById.set(groupKey, {
					keyType: document.keyType,
					key: document.key,
					subKey: document.subKey,
					documentCount: 0,
					statusSummary: this.createStatusSummary(),
					documents: [],
				});
			}

			const documentSubKey = subKeysById.get(groupKey);
			if (!documentSubKey) continue;

			documentSubKey.documentCount += 1;
			this.incrementStatus(documentSubKey.statusSummary, document.status);
			documentSubKey.documents.push({
				id: document.id,
				documentKey: document.documentKey,
				templateId: document.templateId,
				templateName: document.templateName,
				title: document.title,
				description: document.description,
				status: document.status,
				version: document.version,
				checksumSha256: document.checksumSha256,
				updatedAt: document.updatedAt,
				owner: document.owner,
				tags: document.tags ?? [],
			});
		}

		return Array.from(subKeysById.values());
	}

	private groupDocumentTreeRows(rows: DocumentTreeRow[]) {
		return rows.map(
			(row): DocumentTreeSubKey => ({
				keyType: row.key_type,
				key: {
					id: row.key_value,
					name: row.key_name,
				},
				subKey: {
					id: row.sub_key,
					name: row.sub_key_name,
					parentSubKey: row.parent_sub_key
						? {
								id: row.parent_sub_key,
								name: row.parent_sub_key_name ?? "",
							}
						: null,
				},
				documentCount: Number(row.document_count),
				statusSummary: this.createStatusSummaryFromRow(row),
			}),
		);
	}

	private createStatusSummary(): StatusSummary {
		return {
			draft: 0,
			in_review: 0,
			approved: 0,
			archived: 0,
		};
	}

	private createStatusSummaryFromRow(row: DocumentTreeRow): StatusSummary {
		return {
			draft: Number(row.draft_count),
			in_review: Number(row.in_review_count),
			approved: Number(row.approved_count),
			archived: Number(row.archived_count),
		};
	}

	private incrementStatus(
		statusSummary: StatusSummary,
		status: DocumentStatus,
	) {
		statusSummary[status] += 1;
	}

	private resolveStoragePath(storagePath: string, useFileError = false) {
		const absolutePath = path.resolve(PROJECT_ROOT, storagePath);
		const relativePath = path.relative(STORAGE_ROOT, absolutePath);
		const isInsideStorageRoot =
			relativePath === "" ||
			(!relativePath.startsWith("..") && !path.isAbsolute(relativePath));

		if (!isInsideStorageRoot) {
			if (useFileError) {
				throw invalidDocumentFile(
					"fileInfo.storagePath must be inside storage/documents",
				);
			}

			throw invalidDocumentPatch(
				"fileInfo.storagePath must be inside storage/documents",
			);
		}

		return absolutePath;
	}

	private async isExistingFile(absolutePath: string) {
		try {
			const fileStats = await fs.stat(absolutePath);
			return fileStats.isFile();
		} catch {
			return false;
		}
	}
}
