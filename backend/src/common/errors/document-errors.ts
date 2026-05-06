import {
	BadRequestException,
	ConflictException,
	NotFoundException,
} from "@nestjs/common";

export type ApiErrorBody = {
	code: string;
	message: string;
};

export function invalidQueryParam(message = "Parametro query non valido.") {
	return new BadRequestException({
		code: "INVALID_QUERY_PARAM",
		message,
	});
}

export function invalidDocumentId() {
	return new BadRequestException({
		code: "INVALID_DOCUMENT_ID",
		message: "Invalid document id.",
	});
}

export function invalidDocumentPatch(message = "Invalid document patch.") {
	return new BadRequestException({
		code: "INVALID_DOCUMENT_PATCH",
		message,
	});
}

export function keyNotFound() {
	return new NotFoundException({
		code: "KEY_NOT_FOUND",
		message: "Document key not found.",
	});
}

export function documentNotFound() {
	return new NotFoundException({
		code: "DOCUMENT_NOT_FOUND",
		message: "Document not found.",
	});
}

export function documentFileNotFound() {
	return new NotFoundException({
		code: "DOCUMENT_FILE_NOT_FOUND",
		message: "Document file not found.",
	});
}

export function documentArchived() {
	return new ConflictException({
		code: "DOCUMENT_ARCHIVED",
		message: "Il documento archiviato non puo' essere modificato.",
	});
}
