import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DocumentsModule } from "./documents/documents.module";
import { Document } from "./documents/entities/document.entity";
import { DocumentTag } from "./documents/entities/document-tag.entity";
import { Owner } from "./documents/entities/owner.entity";
import { Package } from "./documents/entities/package.entity";
import { Project } from "./documents/entities/project.entity";
import { Tag } from "./documents/entities/tag.entity";
import { Task } from "./documents/entities/task.entity";
import { HealthModule } from "./health/health.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: [".env", "../.env"],
			isGlobal: true,
		}),
		TypeOrmModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				type: "postgres",
				host:
					config.get<string>("DATABASE_HOST") ??
					config.get<string>("DB_HOST") ??
					"localhost",
				port: Number(
					config.get<string>("DATABASE_PORT") ??
						config.get<string>("DB_PORT") ??
						5432,
				),
				username:
					config.get<string>("DATABASE_USER") ??
					config.get<string>("DB_USER") ??
					"postgres",
				password:
					config.get<string>("DATABASE_PASSWORD") ??
					config.get<string>("DB_PASSWORD") ??
					"postgres",
				database:
					config.get<string>("DATABASE_NAME") ??
					config.get<string>("DB_NAME") ??
					"documentale",
				ssl:
					(config.get<string>("DATABASE_SSL") ?? "false") === "true"
						? { rejectUnauthorized: false }
						: false,
				entities: [Project, Package, Task, Owner, Document, Tag, DocumentTag],
				synchronize: false,
			}),
		}),
		HealthModule,
		DocumentsModule,
	],
})
export class AppModule {}
