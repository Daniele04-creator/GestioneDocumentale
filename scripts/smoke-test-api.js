const { access, readFile } = require('node:fs/promises');
const path = require('node:path');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const KEY_TYPE = 'project';
const KEY = 'PRJ-001';
const SUB_KEY = 'PKG-001';
const DOCUMENT_ID = 'DOC-001';
const CREATE_DOCUMENT_KEY = 'SMOKE-REPORT-AVANZAMENTO';
const UPLOAD_SOURCE_FILE = path.join(
  __dirname,
  '..',
  'storage',
  'documents',
  'report-avanzamento.txt',
);
const CREATE_DOCUMENT_BODY = {
  subKey: SUB_KEY,
  documentKey: CREATE_DOCUMENT_KEY,
  templateId: 'TPL-REPORT-SMOKE',
  templateName: 'Template report smoke test',
  title: 'Report avanzamento smoke test',
  description: 'Documento demo registrato dallo smoke test.',
  ownerId: 'owner-001',
  status: 'draft',
  tags: ['Report', 'Progress'],
};

const results = [];
let createdDocumentId;
let firstVersionFileName;
let secondVersionFileName;
let firstVersionChecksum;

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function getDocuments(groupedResponse) {
  return (groupedResponse.data || []).flatMap((documentGroup) =>
    documentGroup.documents || [],
  );
}

function documentHasTag(document, tagName) {
  return (document.tags || []).some(
    (tag) => String(tag.name).toLowerCase() === tagName.toLowerCase(),
  );
}

async function request(method, requestPath, body) {
  const options = {
    method,
    headers: {
      Accept: 'application/json',
    },
  };

  if (body !== undefined) {
    if (body instanceof FormData) {
      options.body = body;
    } else {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
  }

  const response = await fetch(`${BASE_URL}${requestPath}`, options);
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return {
      response,
      body: await response.json(),
    };
  }

  return {
    response,
    body: await response.text(),
  };
}

async function runTest(name, callback) {
  try {
    await callback();
    results.push({ name, ok: true });
    console.log(`OK ${name}`);
  } catch (error) {
    results.push({ name, ok: false });
    console.error(`KO ${name}`);
    console.error(`   ${error.message}`);
  }
}

async function expectJson(method, path, expectedStatus, body) {
  const result = await request(method, path, body);
  assert(
    result.response.status === expectedStatus,
    `Expected status ${expectedStatus}, got ${result.response.status}`,
  );
  return result.body;
}

async function buildCreateDocumentForm(
  overrides = {},
  fileName = '../report-avanzamento.txt',
  fileSuffix = '',
) {
  const body = {
    ...CREATE_DOCUMENT_BODY,
    ...overrides,
  };
  const formData = new FormData();
  const fileBuffer = await readFile(UPLOAD_SOURCE_FILE);

  formData.append('file', new Blob([fileBuffer, fileSuffix], { type: 'text/plain' }), fileName);
  if (body.subKey !== undefined) formData.append('subKey', body.subKey);
  if (body.documentKey !== undefined) formData.append('documentKey', body.documentKey);
  if (body.templateId !== undefined) formData.append('templateId', body.templateId);
  if (body.templateName !== undefined) formData.append('templateName', body.templateName);
  if (body.title !== undefined) formData.append('title', body.title);
  if (body.ownerId !== undefined) formData.append('ownerId', body.ownerId);
  if (body.description !== undefined) formData.append('description', body.description);
  if (body.status !== undefined) formData.append('status', body.status);
  for (const tag of body.tags || []) formData.append('tags', tag);

  return formData;
}

function buildCreateDocumentFormWithoutFile(overrides = {}) {
  const body = {
    ...CREATE_DOCUMENT_BODY,
    ...overrides,
  };
  const formData = new FormData();

  if (body.subKey !== undefined) formData.append('subKey', body.subKey);
  if (body.documentKey !== undefined) formData.append('documentKey', body.documentKey);
  if (body.templateId !== undefined) formData.append('templateId', body.templateId);
  if (body.templateName !== undefined) formData.append('templateName', body.templateName);
  if (body.title !== undefined) formData.append('title', body.title);
  if (body.ownerId !== undefined) formData.append('ownerId', body.ownerId);
  if (body.description !== undefined) formData.append('description', body.description);
  if (body.status !== undefined) formData.append('status', body.status);
  for (const tag of body.tags || []) formData.append('tags', tag);

  return formData;
}

function assertSafeGeneratedFileName(fileName) {
  assert(!fileName.includes('..'), 'Generated fileName must not contain path traversal.');
  assert(!fileName.includes('/'), 'Generated fileName must not contain slash.');
  assert(!fileName.includes('\\'), 'Generated fileName must not contain backslash.');
  assert(fileName.startsWith('uploaded-'), 'Generated fileName should use uploaded- prefix.');
}

async function fileExists(fileName) {
  try {
    await access(path.join(__dirname, '..', 'storage', 'documents', fileName));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await runTest('GET /api/v1/health returns 200', async () => {
    const body = await expectJson('GET', '/api/v1/health', 200);
    assert(body.status === 'ok', 'Expected status ok.');
  });

  await runTest('GET documents by key returns documents', async () => {
    const body = await expectJson('GET', `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents`, 200);
    assert(Array.isArray(body.data), 'Expected data array.');
    assert(body.meta && body.meta.totalDocuments > 0, 'Expected meta.totalDocuments > 0.');
  });

  await runTest('GET document tree by key returns lightweight structure', async () => {
    const body = await expectJson('GET', `/api/v1/document-keys/${KEY_TYPE}/${KEY}/document-tree`, 200);
    assert(Array.isArray(body.data), 'Expected data array.');
    assert(body.data.length > 0, 'Expected at least one subKey.');
    assert(body.meta && body.meta.totalDocuments > 0, 'Expected meta.totalDocuments > 0.');

    const firstSubKey = body.data[0];
    assert(firstSubKey.documentCount >= 1, 'Expected subKey documentCount.');
    assert(firstSubKey.statusSummary, 'Expected subKey statusSummary.');
    assert(
      !Object.prototype.hasOwnProperty.call(firstSubKey, 'documents'),
      'Document tree subKeys must not contain full documents array.',
    );
  });

  await runTest('GET documents by tag Architettura', async () => {
    const body = await expectJson(
      'GET',
      `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents?tag=Architettura`,
      200,
    );
    const documents = getDocuments(body);
    assert(documents.length > 0, 'Expected at least one document.');
    assert(
      documents.every((document) => documentHasTag(document, 'Architettura')),
      'Expected every document to contain tag Architettura.',
    );
  });

  await runTest('GET documents by search Francesca', async () => {
    const body = await expectJson(
      'GET',
      `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents?search=Francesca`,
      200,
    );
    assert(Array.isArray(body.data), 'Expected data array.');
  });

  await runTest('GET documents by subKey returns only that subKey', async () => {
    const body = await expectJson(
      'GET',
      `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents?subKey=${SUB_KEY}`,
      200,
    );
    assert(Array.isArray(body.data), 'Expected data array.');
    assert(body.data.length > 0, 'Expected at least one subKey group.');
    assert(
      body.data.every((group) => group.subKey && group.subKey.id === SUB_KEY),
      `Expected every group to use subKey ${SUB_KEY}.`,
    );
  });

  await runTest('GET documents with wrong query param returns INVALID_QUERY_PARAM', async () => {
    const body = await expectJson(
      'GET',
      `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents?wrongParam=1`,
      400,
    );
    assert(body.code === 'INVALID_QUERY_PARAM', `Expected INVALID_QUERY_PARAM, got ${body.code}.`);
  });

  await runTest('POST documents creates new documentKey version 1', async () => {
    const formData = await buildCreateDocumentForm();
    const body = await expectJson(
      'POST',
      `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents`,
      201,
      formData,
    );

    createdDocumentId = body.data && body.data.id;
    firstVersionFileName = body.data && body.data.fileInfo && body.data.fileInfo.fileName;
    firstVersionChecksum = body.data && body.data.checksumSha256;
    assert(/^DOC-[0-9]{3,}$/.test(createdDocumentId), 'Expected generated DOC-XXX id.');
    assert(body.data.documentKey === CREATE_DOCUMENT_KEY, 'Expected created documentKey.');
    assert(body.data.templateId === CREATE_DOCUMENT_BODY.templateId, 'Expected templateId.');
    assert(body.data.title === CREATE_DOCUMENT_BODY.title, 'Expected created title.');
    assert(body.data.status === 'draft', 'Expected default draft status.');
    assert(body.data.version === 1, 'Expected version 1 for a new documentKey.');
    assert(/^[a-f0-9]{64}$/.test(firstVersionChecksum), 'Expected SHA-256 checksum.');
    assert(body.data.subKey && body.data.subKey.id === SUB_KEY, `Expected subKey ${SUB_KEY}.`);
    assert(body.data.fileInfo, 'Expected public fileInfo.');
    assert(
      !Object.prototype.hasOwnProperty.call(body.data.fileInfo, 'storagePath'),
      'fileInfo must not expose storagePath.',
    );
    assertSafeGeneratedFileName(firstVersionFileName);
    assert(documentHasTag(body.data, 'Report'), 'Expected Report tag on created document.');
    assert(documentHasTag(body.data, 'Progress'), 'Expected Progress tag on created document.');
  });

  await runTest('POST same documentKey and same file updates metadata without new version', async () => {
    assert(createdDocumentId, 'Created document id is missing.');
    const formData = await buildCreateDocumentForm({
      title: 'Report avanzamento smoke test aggiornato',
      description: 'Aggiornamento metadati con stesso checksum.',
      status: undefined,
      tags: undefined,
    });
    const body = await expectJson(
      'POST',
      `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents`,
      201,
      formData,
    );

    assert(body.data.id === createdDocumentId, 'Expected same logical document id.');
    assert(body.data.version === 1, 'Expected version to stay 1 with same checksum.');
    assert(body.data.checksumSha256 === firstVersionChecksum, 'Expected unchanged checksum.');
    assert(
      body.data.fileInfo.fileName === firstVersionFileName,
      'Expected current file to remain the first stored file.',
    );
    assert(documentHasTag(body.data, 'Report'), 'Expected existing Report tag to be preserved.');
    assert(documentHasTag(body.data, 'Progress'), 'Expected existing Progress tag to be preserved.');

    const versions = await expectJson(
      'GET',
      `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents/${createdDocumentId}/versions`,
      200,
    );
    assert(versions.data.length === 1, 'Expected only one version after same checksum update.');
  });

  await runTest('POST same documentKey and different file creates version 2', async () => {
    assert(createdDocumentId, 'Created document id is missing.');
    const formData = await buildCreateDocumentForm(
      {
        title: 'Report avanzamento smoke test v2',
        description: 'Nuova versione con contenuto file diverso.',
        status: 'approved',
        tags: ['Report', 'Progress', 'Versione'],
      },
      'report-avanzamento-v2.txt',
      '\nSeconda versione smoke test.\n',
    );
    const body = await expectJson(
      'POST',
      `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents`,
      201,
      formData,
    );

    secondVersionFileName = body.data && body.data.fileInfo && body.data.fileInfo.fileName;
    assert(body.data.id === createdDocumentId, 'Expected same logical document id.');
    assert(body.data.version === 2, 'Expected version 2 with different checksum.');
    assert(body.data.status === 'approved', 'Expected updated current status.');
    assert(body.data.checksumSha256 !== firstVersionChecksum, 'Expected new checksum.');
    assert(secondVersionFileName !== firstVersionFileName, 'Expected a new stored file name.');
    assert(await fileExists(firstVersionFileName), 'Expected old version file to still exist.');
    assert(await fileExists(secondVersionFileName), 'Expected new version file to exist.');
  });

  await runTest('GET versions returns document history', async () => {
    assert(createdDocumentId, 'Created document id is missing.');
    const body = await expectJson(
      'GET',
      `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents/${createdDocumentId}/versions`,
      200,
    );
    assert(Array.isArray(body.data), 'Expected versions data array.');
    assert(body.data.length === 2, 'Expected two versions.');
    assert(body.data[0].version === 1, 'Expected first version number 1.');
    assert(body.data[1].version === 2, 'Expected second version number 2.');
    assert(body.data[0].checksumSha256 === firstVersionChecksum, 'Expected version 1 checksum.');
    assert(
      !Object.prototype.hasOwnProperty.call(body.data[0].fileInfo, 'storagePath'),
      'version fileInfo must not expose storagePath.',
    );
  });

  await runTest('GET documents contains current created document version', async () => {
    assert(createdDocumentId, 'Created document id is missing.');
    const body = await expectJson('GET', `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents`, 200);
    const documents = getDocuments(body);
    const createdDocument = documents.find((document) => document.id === createdDocumentId);
    assert(createdDocument, `Expected list to contain ${createdDocumentId}.`);
    assert(createdDocument.version === 2, 'Expected list to expose current version 2.');
    assert(createdDocument.documentKey === CREATE_DOCUMENT_KEY, 'Expected list documentKey.');
  });

  await runTest('GET created document detail returns current version', async () => {
    assert(createdDocumentId, 'Created document id is missing.');
    const body = await expectJson(
      'GET',
      `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents/${createdDocumentId}`,
      200,
    );
    assert(body.data && body.data.id === createdDocumentId, `Expected data.id ${createdDocumentId}.`);
    assert(body.data.version === 2, 'Expected detail to expose current version 2.');
  });

  await runTest('GET current document file returns latest version', async () => {
    assert(createdDocumentId, 'Created document id is missing.');
    const result = await request(
      'GET',
      `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents/${createdDocumentId}/file`,
    );
    assert(result.response.status === 200, `Expected status 200, got ${result.response.status}.`);
    assert(String(result.body).length > 0, 'Expected non-empty file response.');
    assert(
      String(result.body).includes('Seconda versione smoke test.'),
      'Expected current file to contain version 2 content.',
    );
  });

  await runTest('GET version 1 file still returns old content', async () => {
    assert(createdDocumentId, 'Created document id is missing.');
    const result = await request(
      'GET',
      `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents/${createdDocumentId}/versions/1/file`,
    );
    assert(result.response.status === 200, `Expected status 200, got ${result.response.status}.`);
    assert(
      !String(result.body).includes('Seconda versione smoke test.'),
      'Expected version 1 file not to contain version 2 content.',
    );
  });

  await runTest('POST documents with missing subKey returns SUB_KEY_NOT_FOUND', async () => {
    const formData = await buildCreateDocumentForm({
      subKey: 'PKG-NOT-FOUND',
      title: 'SubKey missing smoke test',
    });
    const body = await expectJson(
      'POST',
      `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents`,
      404,
      formData,
    );
    assert(body.code === 'SUB_KEY_NOT_FOUND', `Expected SUB_KEY_NOT_FOUND, got ${body.code}.`);
  });

  await runTest('POST documents with missing documentKey returns INVALID_DOCUMENT_PATCH', async () => {
    const formData = await buildCreateDocumentForm({
      documentKey: undefined,
      title: 'Missing documentKey smoke test',
    });
    const body = await expectJson(
      'POST',
      `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents`,
      400,
      formData,
    );
    assert(
      body.code === 'INVALID_DOCUMENT_PATCH',
      `Expected INVALID_DOCUMENT_PATCH, got ${body.code}.`,
    );
  });

  await runTest('POST documents with missing owner returns OWNER_NOT_FOUND', async () => {
    const formData = await buildCreateDocumentForm({
      documentKey: `${CREATE_DOCUMENT_KEY}-OWNER-NOT-FOUND`,
      ownerId: 'owner-not-found',
      title: 'Missing owner smoke test',
    });
    const body = await expectJson(
      'POST',
      `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents`,
      404,
      formData,
    );
    assert(body.code === 'OWNER_NOT_FOUND', `Expected OWNER_NOT_FOUND, got ${body.code}.`);
  });

  await runTest('POST documents without file returns INVALID_DOCUMENT_FILE', async () => {
    const body = await expectJson(
      'POST',
      `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents`,
      400,
      buildCreateDocumentFormWithoutFile({
        title: 'Unsafe file smoke test',
      }),
    );
    assert(
      body.code === 'INVALID_DOCUMENT_FILE',
      `Expected INVALID_DOCUMENT_FILE, got ${body.code}.`,
    );
  });

  await runTest('GET DOC-001 detail returns public fileInfo only', async () => {
    const body = await expectJson(
      'GET',
      `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents/${DOCUMENT_ID}`,
      200,
    );
    assert(body.data && body.data.id === DOCUMENT_ID, `Expected data.id ${DOCUMENT_ID}.`);
    assert(body.data.fileInfo, 'Expected fileInfo.');
    assert(
      !Object.prototype.hasOwnProperty.call(body.data.fileInfo, 'storagePath'),
      'fileInfo must not expose storagePath.',
    );
  });

  await runTest('GET DOC-999 returns DOCUMENT_NOT_FOUND', async () => {
    const body = await expectJson('GET', `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents/DOC-999`, 404);
    assert(body.code === 'DOCUMENT_NOT_FOUND', `Expected DOCUMENT_NOT_FOUND, got ${body.code}.`);
  });

  await runTest('GET invalid document id returns INVALID_DOCUMENT_ID', async () => {
    const body = await expectJson(
      'GET',
      `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents/not-existing-document-id`,
      400,
    );
    assert(body.code === 'INVALID_DOCUMENT_ID', `Expected INVALID_DOCUMENT_ID, got ${body.code}.`);
  });

  await runTest('GET DOC-001 file returns 200', async () => {
    const result = await request(
      'GET',
      `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents/${DOCUMENT_ID}/file`,
    );
    assert(result.response.status === 200, `Expected status 200, got ${result.response.status}.`);
    assert(String(result.body).length > 0, 'Expected non-empty file response.');
  });

  await runTest('PATCH DOC-001 status to in_review', async () => {
    const body = await expectJson(
      'PATCH',
      `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents/${DOCUMENT_ID}`,
      200,
      { status: 'in_review' },
    );
    assert(body.data && body.data.status === 'in_review', 'Expected status in_review.');
  });

  await runTest('PATCH DOC-001 ownerId returns INVALID_DOCUMENT_PATCH', async () => {
    const body = await expectJson(
      'PATCH',
      `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents/${DOCUMENT_ID}`,
      400,
      { ownerId: 'owner-002' },
    );
    assert(
      body.code === 'INVALID_DOCUMENT_PATCH',
      `Expected INVALID_DOCUMENT_PATCH, got ${body.code}.`,
    );
  });

  await runTest('DELETE DOC-001 archives document', async () => {
    const body = await expectJson(
      'DELETE',
      `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents/${DOCUMENT_ID}`,
      200,
    );
    assert(body.data && body.data.status === 'archived', 'Expected status archived.');
  });

  await runTest('PATCH archived DOC-001 returns DOCUMENT_ARCHIVED', async () => {
    const body = await expectJson(
      'PATCH',
      `/api/v1/document-keys/${KEY_TYPE}/${KEY}/documents/${DOCUMENT_ID}`,
      409,
      { status: 'approved' },
    );
    assert(body.code === 'DOCUMENT_ARCHIVED', `Expected DOCUMENT_ARCHIVED, got ${body.code}.`);
  });

  const failed = results.filter((result) => !result.ok);
  const passed = results.length - failed.length;

  console.log('');
  console.log(`Smoke test summary: ${passed}/${results.length} passed.`);
  console.log('After this smoke test, run npm run db:reset for a clean dataset.');

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Smoke test failed before completion.');
  console.error(error.stack || error.message || error);
  process.exit(1);
});
