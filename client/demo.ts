import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  CreateDocumentRequest,
  DocumentKeysApi,
  Configuration,
  HealthApi,
  UpdateDocumentRequest,
} from './index';

const basePath = process.env.API_BASE_URL || 'http://localhost:3000';
const keyType = 'project';
const key = 'PRJ-001';
const documentId = 'DOC-001';
const subKey = 'PKG-001';
const demoDocumentKey = 'CLIENT-DEMO-REPORT';

const configuration = new Configuration({ basePath });
const fetchApi = ((requestUrl: string, init?: any) =>
  fetch(requestUrl, init)) as any;
const healthApi = new HealthApi(configuration, undefined, fetchApi);
const documentsApi = new DocumentKeysApi(configuration, undefined, fetchApi);

async function main() {
  const health = await healthApi.healthControllerGetHealth();
  console.log('health:', health.status);

  const tree = await documentsApi.documentKeysControllerGetDocumentTree(keyType, key);
  console.log('document tree:', tree.meta.totalDocuments);

  const list = await documentsApi.documentKeysControllerListDocuments(keyType, key);
  console.log('key documents:', list.meta.totalDocuments);

  const architetturaFilter = await documentsApi.documentKeysControllerListDocuments(
    keyType,
    key,
    undefined,
    undefined,
    'Architettura',
  );
  assertDocumentsHaveTag(architetturaFilter, 'Architettura');
  console.log('tag Architettura:', architetturaFilter.meta.totalDocuments);

  const qaFilter = await documentsApi.documentKeysControllerListDocuments(
    keyType,
    key,
    undefined,
    undefined,
    'QA',
  );
  assertDocumentsHaveTag(qaFilter, 'QA');
  console.log('tag QA:', qaFilter.meta.totalDocuments);

  const missingTagFilter = await documentsApi.documentKeysControllerListDocuments(
    keyType,
    key,
    undefined,
    undefined,
    'TagInesistente',
  );
  assertEmptyResult(missingTagFilter, 'missing tag');
  console.log('tag TagInesistente:', missingTagFilter.meta.totalDocuments);

  const ownerSearch = await documentsApi.documentKeysControllerListDocuments(
    keyType,
    key,
    'Francesca',
  );
  assertHasDocuments(ownerSearch, 'search Francesca');
  console.log('search Francesca:', ownerSearch.meta.totalDocuments);

  const apiSearch = await documentsApi.documentKeysControllerListDocuments(
    keyType,
    key,
    'api',
  );
  assertHasDocuments(apiSearch, 'search api');
  console.log('search api:', apiSearch.meta.totalDocuments);

  await expectInvalidQueryParam();

  const demoFileBuffer = await readFile(
    join(process.cwd(), '..', 'storage', 'documents', 'report-avanzamento.txt'),
  );
  const created = await documentsApi.documentKeysControllerCreateDocument(
    {
      file: new Blob([demoFileBuffer], { type: 'text/plain' }),
      fileName: '../report-avanzamento.txt',
      subKey,
      documentKey: demoDocumentKey,
      templateId: 'TPL-REPORT-DEMO',
      templateName: 'Template report demo',
      title: 'Report avanzamento client demo',
      description: 'Documento demo registrato dal client TypeScript Fetch',
      ownerId: 'owner-001',
      status: CreateDocumentRequest.StatusEnum.Draft,
      tags: ['Report', 'Progress'],
    },
    keyType,
    key,
  );
  assertSafeGeneratedFileName(created.data.fileInfo.fileName);
  console.log(
    'created document:',
    created.data.id,
    created.data.documentKey,
    `v${created.data.version}`,
  );

  const sameFileUpdate = await documentsApi.documentKeysControllerCreateDocument(
    {
      file: new Blob([demoFileBuffer], { type: 'text/plain' }),
      fileName: 'report-avanzamento.txt',
      subKey,
      documentKey: demoDocumentKey,
      templateId: 'TPL-REPORT-DEMO',
      templateName: 'Template report demo',
      title: 'Report avanzamento client demo aggiornato',
      description: 'Aggiornamento metadati con stesso contenuto file',
      ownerId: 'owner-001',
      status: CreateDocumentRequest.StatusEnum.InReview,
      tags: ['Report', 'Progress', 'Demo'],
    },
    keyType,
    key,
  );
  console.log('same checksum update:', sameFileUpdate.data.id, `v${sameFileUpdate.data.version}`);

  const secondVersion = await documentsApi.documentKeysControllerCreateDocument(
    {
      file: new Blob([demoFileBuffer, '\nSeconda versione demo client.\n'], {
        type: 'text/plain',
      }),
      fileName: 'report-avanzamento-v2.txt',
      subKey,
      documentKey: demoDocumentKey,
      templateId: 'TPL-REPORT-DEMO',
      templateName: 'Template report demo',
      title: 'Report avanzamento client demo v2',
      description: 'Nuova versione con contenuto file diverso',
      ownerId: 'owner-001',
      status: CreateDocumentRequest.StatusEnum.Approved,
      tags: ['Report', 'Progress', 'Demo'],
    },
    keyType,
    key,
  );
  console.log('new file version:', secondVersion.data.id, `v${secondVersion.data.version}`);

  const versions = await documentsApi.documentKeysControllerGetDocumentVersions(
    secondVersion.data.id,
    keyType,
    key,
  );
  if (versions.data.length < 2) {
    throw new Error('Expected at least two versions for the demo document.');
  }
  console.log('document versions:', versions.data.map((item) => item.version).join(', '));

  await documentsApi.documentKeysControllerDownloadDocumentVersionFile(
    secondVersion.data.id,
    1,
    keyType,
    key,
  );
  console.log('downloaded historical version: 1');

  const detail = await documentsApi.documentKeysControllerGetDocumentById(
    documentId,
    keyType,
    key,
  );
  console.log('document detail:', detail.data.id, detail.data.title);

  const updated = await documentsApi.documentKeysControllerUpdateDocument(
    { status: UpdateDocumentRequest.StatusEnum.InReview },
    documentId,
    keyType,
    key,
  );
  console.log('updated status:', updated.data.status);

  const archived = await documentsApi.documentKeysControllerArchiveDocument(
    documentId,
    keyType,
    key,
  );
  console.log('archived status:', archived.data.status);

  await expectArchivedConflict();
  console.log('demo uploaded files kept in storage/documents for version history.');
}

function getDocuments(response: any) {
  return response.data.flatMap((documentGroup: any) =>
    documentGroup.documents || [],
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

function assertSafeGeneratedFileName(fileName: string) {
  if (
    fileName.includes('..') ||
    fileName.includes('/') ||
    fileName.includes('\\') ||
    !fileName.startsWith('uploaded-')
  ) {
    throw new Error(`Generated file name is not safe: ${fileName}.`);
  }
}

async function expectInvalidQueryParam() {
  try {
    await documentsApi.documentKeysControllerListDocuments(
      keyType,
      key,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { query: { wrongParam: '1' } },
    );
    throw new Error('Expected 400 INVALID_QUERY_PARAM, but the request succeeded.');
  } catch (error: any) {
    await expectResponseError(error, 400, 'INVALID_QUERY_PARAM');
  }
}

async function expectArchivedConflict() {
  try {
    await documentsApi.documentKeysControllerUpdateDocument(
      { status: UpdateDocumentRequest.StatusEnum.Approved },
      documentId,
      keyType,
      key,
    );
    throw new Error('Expected 409 DOCUMENT_ARCHIVED, but the request succeeded.');
  } catch (error: any) {
    await expectResponseError(error, 409, 'DOCUMENT_ARCHIVED');
  }
}

async function expectResponseError(error: Response, expectedStatus: number, expectedCode: string) {
  if (error.status !== expectedStatus) {
    throw error;
  }

  const body = await error.json();
  if (body.code !== expectedCode) {
    throw new Error(`Expected ${expectedCode}, got ${body.code}.`);
  }

  console.log('expected error:', error.status, body.code);
}

main().catch(async (error: any) => {
  if (error && typeof error.json === 'function') {
    const body = await error.json();
    console.error('client demo failed:', error.status, body);
  } else {
    console.error('client demo failed:', error);
  }
  process.exit(1);
});
