'use strict';

class ApiError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.message = message;
  }

  toResponseBody() {
    return {
      code: this.code,
      message: this.message,
    };
  }
}

function invalidDocumentId() {
  return new ApiError(400, 'INVALID_DOCUMENT_ID', 'Invalid document id.');
}

function invalidQueryParam(message) {
  return new ApiError(400, 'INVALID_QUERY_PARAM', message || 'Parametro query non valido.');
}

function invalidDocumentPatch(message) {
  return new ApiError(400, 'INVALID_DOCUMENT_PATCH', message || 'Invalid document patch.');
}

function projectNotFound() {
  return new ApiError(404, 'PROJECT_NOT_FOUND', 'Project not found.');
}

function documentNotFound() {
  return new ApiError(404, 'DOCUMENT_NOT_FOUND', 'Document not found.');
}

function documentFileNotFound() {
  return new ApiError(404, 'DOCUMENT_FILE_NOT_FOUND', 'Document file not found.');
}

function documentArchived() {
  return new ApiError(
    409,
    'DOCUMENT_ARCHIVED',
    'Il documento archiviato non può essere modificato.',
  );
}

module.exports = {
  ApiError,
  invalidDocumentId,
  invalidQueryParam,
  invalidDocumentPatch,
  projectNotFound,
  documentNotFound,
  documentFileNotFound,
  documentArchived,
};
