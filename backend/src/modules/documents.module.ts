import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DocumentKeysController } from "../controllers/document-keys.controller";
import { Document } from "../entities/document.entity";
import { DocumentKey } from "../entities/document-key.entity";
import { DocumentSubKey } from "../entities/document-sub-key.entity";
import { DocumentTag } from "../entities/document-tag.entity";
import { DocumentVersion } from "../entities/document-version.entity";
import { Owner } from "../entities/owner.entity";
import { Tag } from "../entities/tag.entity";
import { DocumentsRepository } from "../repositories/documents.repository";
import { DocumentsService } from "../services/documents.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([
			DocumentKey,
			DocumentSubKey,
			Owner,
			Document,
			DocumentVersion,
			Tag,
			DocumentTag,
		]),
	],
	controllers: [DocumentKeysController],
	providers: [DocumentsRepository, DocumentsService],
	exports: [DocumentsService],
})
export class DocumentsModule {}
