import * as fs from "node:fs/promises";
import * as path from "node:path";
import { Injectable } from "@nestjs/common";
import {
	documentArchived,
	documentFileNotFound,
	documentNotFound,
	invalidDocumentId,
	invalidDocumentPatch,
	invalidQueryParam,
	projectNotFound,
} from "../common/errors/document-errors";
import { PROJECT_ROOT, STORAGE_ROOT } from "../common/utils/paths";
import { DOCUMENT_STATUS_VALUES } from "../dto/document-query.dto";
import type { UpdateDocumentDto } from "../dto/update-document.dto";
import type { DocumentStatus } from "../entities/document.entity";
import {
	type DocumentRow,
	DocumentsRepository,
	type DocumentTreeRow,
} from "../repositories/documents.repository";

type StatusSummary = Record<DocumentStatus, number>;
const QUERY_FIELDS = new Set([
	"packageId",
	"ownerId",
	"tag",
	"status",
	"search",
]);
type DocumentListItem = Pick<
	DocumentRow,
	| "id"
	| "title"
	| "description"
	| "status"
	| "version"
	| "updatedAt"
	| "owner"
	| "tags"
>;

type DocumentPackageGroup = {
	project: DocumentRow["project"];
	id: string;
	name: string;
	parentPackage: DocumentRow["parentPackage"];
	documentCount: number;
	statusSummary: StatusSummary;
	documents: DocumentListItem[];
};

type DocumentTreePackage = {
	id: string;
	name: string;
	parentPackage: DocumentRow["parentPackage"];
	documentCount: number;
	statusSummary: StatusSummary;
};

@Injectable()
export class DocumentsService {
	constructor(private readonly documentsRepository: DocumentsRepository) {}

	async getProjectDocuments(projectId: string, query: Record<string, unknown>) {
		const validProjectId = this.validateProjectId(projectId);
		const filters = this.normalizeQuery(query);
		await this.ensureProjectExists(validProjectId);

		const documents = await this.documentsRepository.findAll({
			...filters,
			projectId: validProjectId,
		});

		return this.buildGroupedDocumentsResponse(documents);
	}

	async getProjectDocumentTree(projectId: string) {
		const validProjectId = this.validateProjectId(projectId);
		await this.ensureProjectExists(validProjectId);

		const rows =
			await this.documentsRepository.findDocumentTreeByProject(validProjectId);
		return this.buildDocumentTreeResponse(rows);
	}

	async getProjectDocumentById(projectId: string, documentId: string) {
		const validProjectId = this.validateProjectId(projectId);
		const validDocumentId = this.validateDocumentId(documentId);
		await this.ensureProjectExists(validProjectId);

		const document = await this.documentsRepository.findByProjectAndId(
			validProjectId,
			validDocumentId,
		);

		if (!document) throw documentNotFound();

		return document;
	}

	async getProjectDocumentFile(projectId: string, documentId: string) {
		const validProjectId = this.validateProjectId(projectId);
		const validDocumentId = this.validateDocumentId(documentId);
		await this.ensureProjectExists(validProjectId);

		const fileInfo = await this.documentsRepository.findFileInfoByProjectAndId(
			validProjectId,
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

	async updateProjectDocument(
		projectId: string,
		documentId: string,
		body: UpdateDocumentDto,
	) {
		const payload = this.normalizeUpdatePayload(body);
		const document = await this.getProjectDocumentById(projectId, documentId);

		if (document.status === "archived") throw documentArchived();

		const updatedDocument = await this.documentsRepository.updateForProject(
			projectId,
			documentId,
			{
				...payload,
				updatedAt: new Date().toISOString(),
			},
		);

		if (!updatedDocument) throw documentNotFound();

		return updatedDocument;
	}

	async archiveProjectDocument(projectId: string, documentId: string) {
		await this.getProjectDocumentById(projectId, documentId);

		const now = new Date().toISOString();
		const archivedDocument = await this.documentsRepository.updateForProject(
			projectId,
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

	private async ensureProjectExists(projectId: string) {
		const exists = await this.documentsRepository.projectExists(projectId);

		if (!exists) throw projectNotFound();
	}

	private validateProjectId(projectId: string) {
		if (typeof projectId !== "string" || projectId.trim() === "") {
			throw invalidQueryParam("Invalid project id.");
		}

		return projectId.trim();
	}

	private validateDocumentId(documentId: string) {
		if (typeof documentId !== "string" || !/^DOC-[0-9]{3}$/.test(documentId)) {
			throw invalidDocumentId();
		}

		return documentId;
	}

	private normalizeQuery(query: Record<string, unknown>) {
		for (const field of Object.keys(query)) {
			if (!QUERY_FIELDS.has(field)) throw invalidQueryParam();
		}

		const status = this.optionalStatus(query.status);

		return {
			packageId: this.optionalQueryString(query.packageId, "packageId"),
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

	private buildGroupedDocumentsResponse(documents: DocumentRow[]) {
		const packages = this.groupDocumentsByPackage(documents);

		return {
			data: packages,
			meta: {
				totalPackages: packages.length,
				totalDocuments: packages.reduce(
					(total, documentPackage) => total + documentPackage.documentCount,
					0,
				),
			},
		};
	}

	private buildDocumentTreeResponse(rows: DocumentTreeRow[]) {
		const packages = this.groupDocumentTreeRows(rows);

		return {
			data: packages,
			meta: {
				totalPackages: packages.length,
				totalDocuments: packages.reduce(
					(total, documentPackage) => total + documentPackage.documentCount,
					0,
				),
			},
		};
	}

	private groupDocumentsByPackage(documents: DocumentRow[]) {
		const packagesByProjectAndId = new Map<string, DocumentPackageGroup>();

		for (const document of documents) {
			const projectId = document.project.id;
			const packageId = document.package.id;
			const packageKey = `${projectId}:${packageId}`;

			if (!packagesByProjectAndId.has(packageKey)) {
				packagesByProjectAndId.set(packageKey, {
					project: document.project,
					id: packageId,
					name: document.package.name,
					parentPackage: document.parentPackage,
					documentCount: 0,
					statusSummary: this.createStatusSummary(),
					documents: [],
				});
			}

			const documentPackage = packagesByProjectAndId.get(packageKey);
			if (!documentPackage) continue;

			documentPackage.documentCount += 1;
			this.incrementStatus(documentPackage.statusSummary, document.status);
			documentPackage.documents.push({
				id: document.id,
				title: document.title,
				description: document.description,
				status: document.status,
				version: document.version,
				updatedAt: document.updatedAt,
				owner: document.owner,
				tags: document.tags ?? [],
			});
		}

		return Array.from(packagesByProjectAndId.values());
	}

	private groupDocumentTreeRows(rows: DocumentTreeRow[]) {
		return rows.map(
			(row): DocumentTreePackage => ({
				id: row.package_id,
				name: row.package_name,
				parentPackage: row.parent_package_id
					? {
							id: row.parent_package_id,
							name: row.parent_package_name ?? "",
						}
					: null,
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

	private resolveStoragePath(storagePath: string) {
		const absolutePath = path.resolve(PROJECT_ROOT, storagePath);
		const relativePath = path.relative(STORAGE_ROOT, absolutePath);
		const isInsideStorageRoot =
			relativePath === "" ||
			(!relativePath.startsWith("..") && !path.isAbsolute(relativePath));

		if (!isInsideStorageRoot) {
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
