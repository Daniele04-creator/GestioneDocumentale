import { client } from './generated/client.gen';
import {
  healthControllerGetHealth,
  projectDocumentsControllerArchiveProjectDocument,
  projectDocumentsControllerGetProjectDocumentById,
  projectDocumentsControllerGetProjectDocumentTree,
  projectDocumentsControllerListProjectDocuments,
  projectDocumentsControllerUpdateProjectDocument,
} from './generated';

const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
const projectId = 'project-001';
const documentId = 'DOC-001';

client.setConfig({ baseUrl });

async function main() {
  const health = await expectSuccess(
    healthControllerGetHealth(),
    'health',
  );
  console.log('health:', health.status);

  const tree = await expectSuccess(
    projectDocumentsControllerGetProjectDocumentTree({
      path: { projectId },
    }),
    'document tree',
  );
  console.log('document tree:', tree.meta.totalDocuments);

  const list = await expectSuccess(
    projectDocumentsControllerListProjectDocuments({
      path: { projectId },
    }),
    'project documents',
  );
  console.log('project documents:', list.meta.totalDocuments);

  const architetturaFilter = await expectSuccess(
    projectDocumentsControllerListProjectDocuments({
      path: { projectId },
      query: { tag: 'Architettura' },
    }),
    'tag Architettura',
  );
  assertDocumentsHaveTag(architetturaFilter, 'Architettura');
  console.log('tag Architettura:', architetturaFilter.meta.totalDocuments);

  const qaFilter = await expectSuccess(
    projectDocumentsControllerListProjectDocuments({
      path: { projectId },
      query: { tag: 'QA' },
    }),
    'tag QA',
  );
  assertDocumentsHaveTag(qaFilter, 'QA');
  console.log('tag QA:', qaFilter.meta.totalDocuments);

  const missingTagFilter = await expectSuccess(
    projectDocumentsControllerListProjectDocuments({
      path: { projectId },
      query: { tag: 'TagInesistente' },
    }),
    'tag TagInesistente',
  );
  assertEmptyResult(missingTagFilter, 'missing tag');
  console.log('tag TagInesistente:', missingTagFilter.meta.totalDocuments);

  const ownerSearch = await expectSuccess(
    projectDocumentsControllerListProjectDocuments({
      path: { projectId },
      query: { search: 'Francesca' },
    }),
    'search Francesca',
  );
  assertHasDocuments(ownerSearch, 'search Francesca');
  console.log('search Francesca:', ownerSearch.meta.totalDocuments);

  const apiSearch = await expectSuccess(
    projectDocumentsControllerListProjectDocuments({
      path: { projectId },
      query: { search: 'api' },
    }),
    'search api',
  );
  assertHasDocuments(apiSearch, 'search api');
  console.log('search api:', apiSearch.meta.totalDocuments);

  await expectInvalidQueryParam();

  const detail = await expectSuccess(
    projectDocumentsControllerGetProjectDocumentById({
      path: { projectId, documentId },
    }),
    'document detail',
  );
  console.log('document detail:', detail.data.id, detail.data.title);

  const updated = await expectSuccess(
    projectDocumentsControllerUpdateProjectDocument({
      path: { projectId, documentId },
      body: { status: 'in_review' },
    }),
    'update document',
  );
  console.log('updated status:', updated.data.status);

  const archived = await expectSuccess(
    projectDocumentsControllerArchiveProjectDocument({
      path: { projectId, documentId },
    }),
    'archive document',
  );
  console.log('archived status:', archived.data.status);

  await expectArchivedConflict();
}

function getDocuments(response: any) {
  return response.data.flatMap((documentPackage: any) =>
    documentPackage.tasks.flatMap((task: any) => task.documents),
  );
}

function assertDocumentsHaveTag(response: any, tagName: string) {
  const documents = getDocuments(response);

  if (documents.length === 0) {
    throw new Error(`Expected documents for tag ${tagName}.`);
  }

  const invalidDocument = documents.find(
    (document: any) =>
      !document.tags.some(
        (tag: any) => tag.name.toLowerCase() === tagName.toLowerCase(),
      ),
  );

  if (invalidDocument) {
    throw new Error(`Document ${invalidDocument.id} does not contain tag ${tagName}.`);
  }
}

function assertEmptyResult(response: any, label: string) {
  if (response.data.length !== 0 || response.meta.totalDocuments !== 0) {
    throw new Error(`Expected empty result for ${label}.`);
  }
}

function assertHasDocuments(response: any, label: string) {
  if (response.meta.totalDocuments <= 0 || getDocuments(response).length <= 0) {
    throw new Error(`Expected at least one document for ${label}.`);
  }
}

async function expectInvalidQueryParam() {
  const response = await projectDocumentsControllerListProjectDocuments({
    path: { projectId },
    query: { wrongParam: '1' },
  } as any);

  expectError(response, 400, 'INVALID_QUERY_PARAM');
  console.log('invalid query:', response.response?.status, response.error?.code);
}

async function expectArchivedConflict() {
  const response = await projectDocumentsControllerUpdateProjectDocument({
    path: { projectId, documentId },
    body: { status: 'approved' },
  });

  expectError(response, 409, 'DOCUMENT_ARCHIVED');
  console.log('archived conflict:', response.response?.status, response.error?.code);
}

async function expectSuccess<T>(
  request: Promise<{ data?: T; error?: unknown; response?: Response }>,
  label: string,
) {
  const response = await request;

  if (response.error || !response.data) {
    throw new Error(`${label} failed with status ${response.response?.status}.`);
  }

  return response.data;
}

function expectError(
  response: { error?: any; response?: Response },
  expectedStatus: number,
  expectedCode: string,
) {
  if (response.response?.status !== expectedStatus || response.error?.code !== expectedCode) {
    throw new Error(
      `Expected ${expectedStatus} ${expectedCode}, got ${response.response?.status} ${response.error?.code}.`,
    );
  }
}

main().catch((error: any) => {
  console.error('client demo failed:', error);
  process.exit(1);
});
