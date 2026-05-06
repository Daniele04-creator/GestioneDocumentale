import "reflect-metadata";
import * as path from "node:path";
import * as dotenv from "dotenv";
import { DataSource } from "typeorm";
import { Document } from "../entities/document.entity";
import { DocumentKey } from "../entities/document-key.entity";
import { DocumentSubKey } from "../entities/document-sub-key.entity";
import { DocumentTag } from "../entities/document-tag.entity";
import { Tag } from "../entities/tag.entity";

dotenv.config({
	path: [
		path.resolve(process.cwd(), ".env"),
		path.resolve(process.cwd(), "..", ".env"),
	],
});

function env(name: string, fallbackName: string, fallbackValue: string) {
	return process.env[name] ?? process.env[fallbackName] ?? fallbackValue;
}

export const AppDataSource = new DataSource({
	type: "postgres",
	host: env("DATABASE_HOST", "DB_HOST", "localhost"),
	port: Number(env("DATABASE_PORT", "DB_PORT", "5432")),
	username: env("DATABASE_USER", "DB_USER", "postgres"),
	password: env("DATABASE_PASSWORD", "DB_PASSWORD", "postgres"),
	database: env("DATABASE_NAME", "DB_NAME", "documentale"),
	ssl:
		(process.env.DATABASE_SSL ?? "false") === "true"
			? { rejectUnauthorized: false }
			: false,
	entities: [DocumentKey, DocumentSubKey, Document, Tag, DocumentTag],
	migrations: [path.join(__dirname, "migrations", "*.{ts,js}")],
	synchronize: false,
});
