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

@Controller("api/v1/document-keys/:keyType/:key")
export class DocumentKeysController {
	constructor(private readonly documentsService: DocumentsService) {}

	@Get("document-tree")
	getDocumentTree(
		@Param("keyType") keyType: string,
		@Param("key") key: string,
	) {
		return this.documentsService.getDocumentTree(keyType, key);
	}

	@Get("documents")
	listDocuments(
		@Param("keyType") keyType: string,
		@Param("key") key: string,
		@Query() query: Record<string, unknown>,
	) {
		return this.documentsService.getDocuments(keyType, key, query);
	}

	@Get("documents/:documentId/file")
	async downloadDocumentFile(
		@Param("keyType") keyType: string,
		@Param("key") key: string,
		@Param("documentId") documentId: string,
		@Res({ passthrough: true }) response: Response,
	) {
		const file = await this.documentsService.getDocumentFile(
			keyType,
			key,
			documentId,
		);

		response.set({
			"Content-Type": file.mimeType,
			"Content-Disposition": `attachment; filename="${file.fileName}"`,
		});

		return new StreamableFile(createReadStream(file.absolutePath));
	}

	@Get("documents/:documentId")
	async getDocumentById(
		@Param("keyType") keyType: string,
		@Param("key") key: string,
		@Param("documentId") documentId: string,
	) {
		const document = await this.documentsService.getDocumentById(
			keyType,
			key,
			documentId,
		);
		return { data: document };
	}

	@Patch("documents/:documentId")
	async updateDocument(
		@Param("keyType") keyType: string,
		@Param("key") key: string,
		@Param("documentId") documentId: string,
		@Body(patchValidationPipe) body: UpdateDocumentDto,
	) {
		const document = await this.documentsService.updateDocument(
			keyType,
			key,
			documentId,
			body,
		);
		return { data: document };
	}

	@Delete("documents/:documentId")
	async archiveDocument(
		@Param("keyType") keyType: string,
		@Param("key") key: string,
		@Param("documentId") documentId: string,
	) {
		const document = await this.documentsService.archiveDocument(
			keyType,
			key,
			documentId,
		);
		return { data: document };
	}
}
