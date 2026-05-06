import { createReadStream } from "node:fs";
import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Query,
	Res,
	StreamableFile,
	ValidationPipe,
} from "@nestjs/common";
import type { Response } from "express";
import { invalidDocumentPatch } from "../common/errors/document-errors";
import { UpdateDocumentDto } from "../dto/update-document.dto";
import { DocumentsService } from "../services/documents.service";

const patchValidationPipe = new ValidationPipe({
	transform: true,
	whitelist: true,
	forbidNonWhitelisted: true,
	exceptionFactory: () => invalidDocumentPatch(),
});

@Controller("api/v1/projects/:projectId")
export class ProjectDocumentsController {
	constructor(private readonly documentsService: DocumentsService) {}

	@Get("document-tree")
	getProjectDocumentTree(@Param("projectId") projectId: string) {
		return this.documentsService.getProjectDocumentTree(projectId);
	}

	@Get("documents")
	listProjectDocuments(
		@Param("projectId") projectId: string,
		@Query() query: Record<string, unknown>,
	) {
		return this.documentsService.getProjectDocuments(projectId, query);
	}

	@Get("documents/:documentId/file")
	async downloadProjectDocumentFile(
		@Param("projectId") projectId: string,
		@Param("documentId") documentId: string,
		@Res({ passthrough: true }) response: Response,
	) {
		const file = await this.documentsService.getProjectDocumentFile(
			projectId,
			documentId,
		);

		response.set({
			"Content-Type": file.mimeType,
			"Content-Disposition": `attachment; filename="${file.fileName}"`,
		});

		return new StreamableFile(createReadStream(file.absolutePath));
	}

	@Get("documents/:documentId")
	async getProjectDocumentById(
		@Param("projectId") projectId: string,
		@Param("documentId") documentId: string,
	) {
		const document = await this.documentsService.getProjectDocumentById(
			projectId,
			documentId,
		);
		return { data: document };
	}

	@Patch("documents/:documentId")
	async updateProjectDocument(
		@Param("projectId") projectId: string,
		@Param("documentId") documentId: string,
		@Body(patchValidationPipe) body: UpdateDocumentDto,
	) {
		const document = await this.documentsService.updateProjectDocument(
			projectId,
			documentId,
			body,
		);
		return { data: document };
	}

	@Delete("documents/:documentId")
	async archiveProjectDocument(
		@Param("projectId") projectId: string,
		@Param("documentId") documentId: string,
	) {
		const document = await this.documentsService.archiveProjectDocument(
			projectId,
			documentId,
		);
		return { data: document };
	}
}
