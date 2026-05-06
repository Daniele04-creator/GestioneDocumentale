import { createReadStream } from "node:fs";
import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	Res,
	StreamableFile,
	UploadedFile,
	UseInterceptors,
	ValidationPipe,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { invalidDocumentPatch } from "../common/errors/document-errors";
import { CreateDocumentDto } from "../dto/create-document.dto";
import { UpdateDocumentDto } from "../dto/update-document.dto";
import { DocumentsService } from "../services/documents.service";

const createValidationPipe = new ValidationPipe({
	transform: true,
	whitelist: true,
	forbidNonWhitelisted: true,
	exceptionFactory: () => invalidDocumentPatch(),
});

const patchValidationPipe = new ValidationPipe({
	transform: true,
	whitelist: true,
	forbidNonWhitelisted: true,
	exceptionFactory: () => invalidDocumentPatch(),
});

const maxDocumentUploadSizeBytes = 10 * 1024 * 1024;

type UploadedDocumentFile = {
	originalname?: string;
	mimetype?: string;
	size?: number;
	buffer?: Buffer;
};

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

	@Post("documents")
	@UseInterceptors(
		FileInterceptor("file", {
			limits: {
				fileSize: maxDocumentUploadSizeBytes,
				files: 1,
			},
		}),
	)
	async createDocument(
		@Param("keyType") keyType: string,
		@Param("key") key: string,
		@Body(createValidationPipe) body: CreateDocumentDto,
		@UploadedFile() file: UploadedDocumentFile | undefined,
	) {
		const document = await this.documentsService.createDocument(
			keyType,
			key,
			body,
			file,
		);
		return { data: document };
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

	@Get("documents/:documentId/versions/:version/file")
	async downloadDocumentVersionFile(
		@Param("keyType") keyType: string,
		@Param("key") key: string,
		@Param("documentId") documentId: string,
		@Param("version") version: string,
		@Res({ passthrough: true }) response: Response,
	) {
		const file = await this.documentsService.getDocumentVersionFile(
			keyType,
			key,
			documentId,
			version,
		);

		response.set({
			"Content-Type": file.mimeType,
			"Content-Disposition": `attachment; filename="${file.fileName}"`,
		});

		return new StreamableFile(createReadStream(file.absolutePath));
	}

	@Get("documents/:documentId/versions")
	getDocumentVersions(
		@Param("keyType") keyType: string,
		@Param("key") key: string,
		@Param("documentId") documentId: string,
	) {
		return this.documentsService.getDocumentVersions(keyType, key, documentId);
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
