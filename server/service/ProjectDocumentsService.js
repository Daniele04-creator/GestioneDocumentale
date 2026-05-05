'use strict';

const documentsService = require('../lib/documentsService');
const { toHttpError } = require('../lib/response');

/**
 * Archive project document
 * Archivia logicamente il documento impostando status archived e archivedAt.
 *
 * documentId String ID del documento nel formato DOC-001
 * projectId  ID del progetto
 * returns inline_response_200_2
 **/
exports.projectDocumentsController_archiveProjectDocument = function(documentId, projectId) {
  return documentsService
    .archiveProjectDocument(projectId, documentId)
    .then((document) => ({ data: document }))
    .catch((error) => Promise.reject(toHttpError(error)));
};

/**
 * Download project document file
 * Scarica il file associato al documento.
 *
 * documentId String ID del documento nel formato DOC-001
 * projectId  ID del progetto
 * returns byte[]
 **/
exports.projectDocumentsController_downloadProjectDocumentFile = function(documentId, projectId) {
  return documentsService
    .getProjectDocumentFile(projectId, documentId)
    .catch((error) => Promise.reject(toHttpError(error)));
};

/**
 * Get project document tree
 * Restituisce una struttura leggera package -> task con conteggi documento.
 *
 * projectId  ID del progetto
 * returns inline_response_200_3
 **/
exports.projectDocumentsController_getProjectDocumentTree = function(projectId) {
  return documentsService
    .getProjectDocumentTree(projectId)
    .catch((error) => Promise.reject(toHttpError(error)));
};

/**
 * Get project document by id
 * Restituisce il dettaglio di un documento appartenente al progetto indicato.
 *
 * documentId String ID del documento nel formato DOC-001
 * projectId  ID del progetto
 * returns inline_response_200_2
 **/
exports.projectDocumentsController_getProjectDocumentById = function(documentId, projectId) {
  return documentsService
    .getProjectDocumentById(projectId, documentId)
    .then((document) => ({ data: document }))
    .catch((error) => Promise.reject(toHttpError(error)));
};

/**
 * List project documents
 * Restituisce la home documentale del progetto, con documenti raggruppati per package e task.
 *
 * projectId  ID del progetto
 * search   (optional)
 * status String  (optional)
 * tag   (optional)
 * ownerId   (optional)
 * taskId   (optional)
 * packageId   (optional)
 * query Object full query string for unknown parameter validation
 * returns inline_response_200_1
 **/
exports.projectDocumentsController_listProjectDocuments = function(
  projectId,
  search,
  status,
  tag,
  ownerId,
  taskId,
  packageId,
  query,
) {
  return documentsService
    .getProjectDocuments(projectId, {
      ...(query || {}),
      search,
      status,
      tag,
      ownerId,
      taskId,
      packageId,
    })
    .catch((error) => Promise.reject(toHttpError(error)));
};

/**
 * Update project document
 * Aggiorna i campi modificabili di un documento non archiviato.
 *
 * body Documents_documentId_body
 * documentId String ID del documento nel formato DOC-001
 * projectId  ID del progetto
 * returns inline_response_200_2
 **/
exports.projectDocumentsController_updateProjectDocument = function(body, documentId, projectId) {
  return documentsService
    .updateProjectDocument(projectId, documentId, body)
    .then((document) => ({ data: document }))
    .catch((error) => Promise.reject(toHttpError(error)));
};
