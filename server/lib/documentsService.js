'use strict';

const fs = require('fs/promises');
const path = require('path');
const repository = require('./documentsRepository');
const {
  documentArchived,
  documentFileNotFound,
  documentNotFound,
  invalidDocumentPatch,
  projectNotFound,
} = require('./apiError');
const {
  validateDocumentId,
  validateProjectDocumentsQuery,
  validateProjectId,
  validateUpdateDocumentPayload,
} = require('./validators');
const { PROJECT_ROOT, STORAGE_ROOT } = require('./paths');

async function getProjectDocuments(projectId, query) {
  const validProjectId = validateProjectId(projectId);
  const filters = validateProjectDocumentsQuery(query);
  await ensureProjectExists(validProjectId);

  const documents = await repository.findAll({
    ...filters,
    projectId: validProjectId,
  });

  return buildGroupedDocumentsResponse(documents);
}

async function getProjectDocumentById(projectId, documentId) {
  const validProjectId = validateProjectId(projectId);
  const validDocumentId = validateDocumentId(documentId);
  await ensureProjectExists(validProjectId);

  const document = await repository.findByProjectAndId(
    validProjectId,
    validDocumentId,
  );

  if (!document) {
    throw documentNotFound();
  }

  return document;
}

async function getProjectDocumentFile(projectId, documentId) {
  const validProjectId = validateProjectId(projectId);
  const validDocumentId = validateDocumentId(documentId);
  await ensureProjectExists(validProjectId);

  const fileInfo = await repository.findFileInfoByProjectAndId(
    validProjectId,
    validDocumentId,
  );

  if (!fileInfo) {
    throw documentNotFound();
  }

  if (!fileInfo.storagePath) {
    throw documentFileNotFound();
  }

  const absolutePath = resolveStoragePath(fileInfo.storagePath);
  const fileExists = await isExistingFile(absolutePath);

  if (!fileExists) {
    throw documentFileNotFound();
  }

  return {
    absolutePath,
    fileName: fileInfo.fileName || path.basename(absolutePath),
    mimeType: fileInfo.mimeType || 'application/octet-stream',
  };
}

async function updateProjectDocument(projectId, documentId, body) {
  const payload = validateUpdateDocumentPayload(body);
  const document = await getProjectDocumentById(projectId, documentId);

  if (document.status === 'archived') {
    throw documentArchived();
  }

  const updatedDocument = await repository.updateForProject(
    projectId,
    documentId,
    {
      ...buildUpdateChanges(payload),
      updatedAt: new Date().toISOString(),
    },
  );

  if (!updatedDocument) {
    throw documentNotFound();
  }

  return updatedDocument;
}

async function archiveProjectDocument(projectId, documentId) {
  await getProjectDocumentById(projectId, documentId);

  const now = new Date().toISOString();
  const archivedDocument = await repository.updateForProject(
    projectId,
    documentId,
    {
      status: 'archived',
      archivedAt: now,
      updatedAt: now,
    },
  );

  if (!archivedDocument) {
    throw documentNotFound();
  }

  return archivedDocument;
}

async function ensureProjectExists(projectId) {
  const exists = await repository.projectExists(projectId);

  if (!exists) {
    throw projectNotFound();
  }
}

function buildUpdateChanges(payload) {
  const changes = {};

  if (payload.title !== undefined) {
    changes.title = payload.title;
  }

  if (payload.description !== undefined) {
    changes.description = payload.description;
  }

  if (payload.status !== undefined) {
    changes.status = payload.status;
  }

  return changes;
}

function buildGroupedDocumentsResponse(documents) {
  const packages = groupDocumentsByPackage(documents);

  return {
    data: packages,
    meta: {
      totalPackages: packages.length,
      totalTasks: packages.reduce(
        (total, documentPackage) => total + documentPackage.taskCount,
        0,
      ),
      totalDocuments: packages.reduce(
        (total, documentPackage) => total + documentPackage.documentCount,
        0,
      ),
    },
  };
}

function groupDocumentsByPackage(documents) {
  const packagesByProjectAndId = new Map();
  const tasksByPackageAndId = new Map();

  for (const document of documents) {
    const projectId = document.project && document.project.id;
    const projectName = document.project && document.project.name;
    const packageId = document.package && document.package.id;
    const packageName = document.package && document.package.name;
    const taskId = document.task && document.task.id;
    const taskName = document.task && document.task.name;

    if (!projectId || !projectName || !packageId || !packageName || !taskId || !taskName) {
      continue;
    }

    const packageKey = `${projectId}:${packageId}`;

    if (!packagesByProjectAndId.has(packageKey)) {
      packagesByProjectAndId.set(packageKey, {
        project: {
          id: projectId,
          name: projectName,
        },
        id: packageId,
        name: packageName,
        parentPackage: document.parentPackage,
        taskCount: 0,
        documentCount: 0,
        statusSummary: createStatusSummary(),
        tasks: [],
      });
    }

    const documentPackage = packagesByProjectAndId.get(packageKey);
    const taskKey = `${packageKey}:${taskId}`;

    if (!tasksByPackageAndId.has(taskKey)) {
      const task = {
        id: taskId,
        name: taskName,
        documentCount: 0,
        statusSummary: createStatusSummary(),
        documents: [],
      };

      tasksByPackageAndId.set(taskKey, task);
      documentPackage.taskCount += 1;
      documentPackage.tasks.push(task);
    }

    const task = tasksByPackageAndId.get(taskKey);

    documentPackage.documentCount += 1;
    task.documentCount += 1;
    incrementStatus(documentPackage.statusSummary, document.status);
    incrementStatus(task.statusSummary, document.status);
    task.documents.push({
      id: document.id,
      title: document.title,
      description: document.description,
      status: document.status,
      version: document.version,
      updatedAt: document.updatedAt,
      owner: document.owner,
      tags: document.tags,
    });
  }

  return Array.from(packagesByProjectAndId.values());
}

function createStatusSummary() {
  return {
    draft: 0,
    in_review: 0,
    approved: 0,
    archived: 0,
  };
}

function incrementStatus(statusSummary, status) {
  if (statusSummary[status] !== undefined) {
    statusSummary[status] += 1;
  }
}

function resolveStoragePath(storagePath) {
  const absolutePath = path.resolve(PROJECT_ROOT, storagePath);

  if (!isInsideStorageRoot(absolutePath)) {
    throw invalidDocumentPatch(
      'fileInfo.storagePath must be inside storage/documents',
    );
  }

  return absolutePath;
}

function isInsideStorageRoot(absolutePath) {
  const relativePath = path.relative(STORAGE_ROOT, absolutePath);

  return (
    relativePath === '' ||
    (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
  );
}

async function isExistingFile(absolutePath) {
  try {
    const fileStats = await fs.stat(absolutePath);
    return fileStats.isFile();
  } catch {
    return false;
  }
}

module.exports = {
  getProjectDocuments,
  getProjectDocumentById,
  getProjectDocumentFile,
  updateProjectDocument,
  archiveProjectDocument,
};
