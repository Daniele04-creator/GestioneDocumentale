'use strict';

const {
  invalidDocumentId,
  invalidDocumentPatch,
  invalidQueryParam,
} = require('./apiError');

const DOCUMENT_STATUS_VALUES = ['draft', 'in_review', 'approved', 'archived'];
const PATCH_STATUS_VALUES = ['draft', 'in_review', 'approved'];
const PROJECT_QUERY_FIELDS = [
  'packageId',
  'taskId',
  'ownerId',
  'tag',
  'status',
  'search',
];

function validateProjectId(projectId) {
  if (typeof projectId !== 'string' || projectId.trim() === '') {
    throw invalidQueryParam('Invalid project id.');
  }

  return projectId.trim();
}

function validateDocumentId(documentId) {
  if (typeof documentId !== 'string' || !/^DOC-[0-9]{3}$/.test(documentId)) {
    throw invalidDocumentId();
  }

  return documentId;
}

function validateProjectDocumentsQuery(query) {
  const safeQuery = query || {};

  for (const field of Object.keys(safeQuery)) {
    if (!PROJECT_QUERY_FIELDS.includes(field)) {
      throw invalidQueryParam('Parametro query non valido.');
    }
  }

  return {
    packageId: optionalString(safeQuery.packageId, 'packageId'),
    taskId: optionalString(safeQuery.taskId, 'taskId'),
    ownerId: optionalString(safeQuery.ownerId, 'ownerId'),
    tag: optionalString(safeQuery.tag, 'tag'),
    search: optionalString(safeQuery.search, 'search', true),
    status:
      safeQuery.status === undefined
        ? undefined
        : requiredEnum(
            safeQuery.status,
            DOCUMENT_STATUS_VALUES,
            'status',
            invalidQueryParam,
          ),
  };
}

function validateUpdateDocumentPayload(body) {
  assertPlainObject(body);

  const allowedFields = ['title', 'description', 'status'];
  for (const field of Object.keys(body)) {
    if (!allowedFields.includes(field)) {
      throw invalidDocumentPatch(`Request body has unknown field: ${field}`);
    }
  }

  if (Object.keys(body).length === 0) {
    throw invalidDocumentPatch('Request body must contain at least one field');
  }

  const payload = {};

  if (body.title !== undefined) {
    payload.title = requiredString(body.title, 'title', 200);
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string') {
      throw invalidDocumentPatch('description must be a string');
    }
    payload.description = body.description;
  }

  if (body.status !== undefined) {
    payload.status = requiredEnum(
      body.status,
      PATCH_STATUS_VALUES,
      'status',
      invalidDocumentPatch,
    );
  }

  return payload;
}

function optionalString(value, field, allowEmpty) {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value) || typeof value !== 'string') {
    throw invalidQueryParam(`${field} must be a string`);
  }

  const trimmedValue = value.trim();

  if (!allowEmpty && trimmedValue === '') {
    throw invalidQueryParam(`${field} must be a non-empty string`);
  }

  return trimmedValue === '' ? undefined : trimmedValue;
}

function requiredString(value, field, maxLength) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw invalidDocumentPatch(`${field} must be a non-empty string`);
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length > maxLength) {
    throw invalidDocumentPatch(
      `${field} must be less than or equal to ${maxLength} characters`,
    );
  }

  return trimmedValue;
}

function requiredEnum(value, allowedValues, field, errorFactory) {
  if (Array.isArray(value) || typeof value !== 'string') {
    throw errorFactory(`${field} must be a string`);
  }

  if (!allowedValues.includes(value)) {
    throw errorFactory(`${field} must be one of: ${allowedValues.join(', ')}`);
  }

  return value;
}

function assertPlainObject(value) {
  const prototype = value === null ? undefined : Object.getPrototypeOf(value);
  const isPlainObject =
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (prototype === Object.prototype || prototype === null);

  if (!isPlainObject) {
    throw invalidDocumentPatch('Request body must be an object');
  }
}

module.exports = {
  validateProjectId,
  validateDocumentId,
  validateProjectDocumentsQuery,
  validateUpdateDocumentPayload,
};
