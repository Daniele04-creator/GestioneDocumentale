import {
	IsIn,
	IsObject,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";
import type { DocumentStatus } from "../entities/document.entity";

export const PATCH_DOCUMENT_STATUS_VALUES: Exclude<
	DocumentStatus,
	"archived"
>[] = ["draft", "in_review", "approved"];

export class UpdateDocumentDto {
	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(200)
	title?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsObject()
	metadata?: Record<string, unknown>;

	@IsOptional()
	@IsIn(PATCH_DOCUMENT_STATUS_VALUES)
	status?: Exclude<DocumentStatus, "archived">;
}
