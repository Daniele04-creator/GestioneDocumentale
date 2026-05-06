import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProjectDocumentsController } from "./controllers/project-documents.controller";
import { Document } from "./entities/document.entity";
import { DocumentTag } from "./entities/document-tag.entity";
import { Owner } from "./entities/owner.entity";
import { Package } from "./entities/package.entity";
import { Project } from "./entities/project.entity";
import { Tag } from "./entities/tag.entity";
import { Task } from "./entities/task.entity";
import { DocumentsRepository } from "./repositories/documents.repository";
import { DocumentsService } from "./services/documents.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Project,
			Package,
			Task,
			Owner,
			Document,
			Tag,
			DocumentTag,
		]),
	],
	controllers: [ProjectDocumentsController],
	providers: [DocumentsRepository, DocumentsService],
	exports: [DocumentsService],
})
export class DocumentsModule {}
