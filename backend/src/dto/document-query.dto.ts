import { IsIn, IsOptional, IsString } from "class-validator";
import type { DocumentStatus } from "../entities/document.entity";

export const DOCUMENT_STATUS_VALUES: DocumentStatus[] = [
	"draft",
	"in_review",
	"approved",
	"archived",
];

export class DocumentQueryDto {
	@IsOptional()
	@IsString()
	subKey?: string;

	@IsOptional()
	@IsString()
	ownerId?: string;

	@IsOptional()
	@IsString()
	tag?: string;

	@IsOptional()
	@IsIn(DOCUMENT_STATUS_VALUES)
	status?: DocumentStatus;

	@IsOptional()
	@IsString()
	search?: string;
}
