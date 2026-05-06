import { Transform } from "class-transformer";
import {
	IsArray,
	IsIn,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";
import type { DocumentStatus } from "../entities/document.entity";

export const CREATE_DOCUMENT_STATUS_VALUES: Exclude<
	DocumentStatus,
	"archived"
>[] = ["draft", "in_review", "approved"];

export class CreateDocumentDto {
	@IsString()
	@MinLength(1)
	subKey!: string;

	@IsString()
	@MinLength(1)
	@MaxLength(150)
	documentKey!: string;

	@IsOptional()
	@IsString()
	@MaxLength(150)
	templateId?: string;

	@IsOptional()
	@IsString()
	@MaxLength(200)
	templateName?: string;

	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(200)
	title?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	metadata?: unknown;

	@IsOptional()
	@IsIn(CREATE_DOCUMENT_STATUS_VALUES)
	status?: Exclude<DocumentStatus, "archived">;

	@IsOptional()
	@Transform(({ value }) => normalizeTags(value))
	@IsArray()
	@IsString({ each: true })
	@MinLength(1, { each: true })
	tags?: string[];
}

function normalizeTags(value: unknown) {
	if (value === undefined || value === null || value === "") return undefined;

	if (Array.isArray(value)) {
		return value.flatMap((item) => normalizeTags(item) ?? []);
	}

	if (typeof value !== "string") return value;

	const trimmedValue = value.trim();
	if (trimmedValue === "") return undefined;

	if (trimmedValue.startsWith("[") && trimmedValue.endsWith("]")) {
		try {
			const parsedValue = JSON.parse(trimmedValue);
			return Array.isArray(parsedValue) ? parsedValue : [trimmedValue];
		} catch {
			return [trimmedValue];
		}
	}

	return trimmedValue
		.split(",")
		.map((tag) => tag.trim())
		.filter((tag) => tag.length > 0);
}
