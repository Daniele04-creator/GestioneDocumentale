import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Document } from "./entities/document.entity";
import { DocumentKey } from "./entities/document-key.entity";
import { DocumentSubKey } from "./entities/document-sub-key.entity";
import { DocumentTag } from "./entities/document-tag.entity";
import { Tag } from "./entities/tag.entity";
import { DocumentsModule } from "./modules/documents.module";
import { HealthModule } from "./modules/health.module";

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
				entities: [DocumentKey, DocumentSubKey, Document, Tag, DocumentTag],
				synchronize: false,
			}),
		}),
		HealthModule,
		DocumentsModule,
	],
})
export class AppModule {}
