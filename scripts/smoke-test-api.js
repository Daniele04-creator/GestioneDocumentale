const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const PROJECT_ID = 'project-001';
const DOCUMENT_ID = 'DOC-001';

const results = [];

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function getDocuments(groupedResponse) {
  return (groupedResponse.data || []).flatMap((documentPackage) =>
    (documentPackage.tasks || []).flatMap((task) => task.documents || []),
  );
}

function documentHasTag(document, tagName) {
  return (document.tags || []).some(
    (tag) => String(tag.name).toLowerCase() === tagName.toLowerCase(),
  );
}

async function request(method, path, body) {
  const options = {
    method,
    headers: {
      Accept: 'application/json',
    },
  };

  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
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

async function main() {
  await runTest('GET /api/v1/health returns 200', async () => {
    const body = await expectJson('GET', '/api/v1/health', 200);
    assert(body.status === 'ok', 'Expected status ok.');
  });

  await runTest('GET project documents returns documents', async () => {
    const body = await expectJson('GET', `/api/v1/projects/${PROJECT_ID}/documents`, 200);
    assert(Array.isArray(body.data), 'Expected data array.');
    assert(body.meta && body.meta.totalDocuments > 0, 'Expected meta.totalDocuments > 0.');
  });

  await runTest('GET project document tree returns lightweight structure', async () => {
    const body = await expectJson('GET', `/api/v1/projects/${PROJECT_ID}/document-tree`, 200);
    assert(Array.isArray(body.data), 'Expected data array.');
    assert(body.data.length > 0, 'Expected at least one package.');
    assert(body.meta && body.meta.totalDocuments > 0, 'Expected meta.totalDocuments > 0.');

    const firstPackage = body.data[0];
    assert(firstPackage.taskCount >= 1, 'Expected package taskCount.');
    assert(firstPackage.documentCount >= 1, 'Expected package documentCount.');
    assert(firstPackage.statusSummary, 'Expected package statusSummary.');
    assert(Array.isArray(firstPackage.tasks), 'Expected package tasks array.');

    const firstTask = firstPackage.tasks[0];
    assert(firstTask.documentCount >= 1, 'Expected task documentCount.');
    assert(firstTask.statusSummary, 'Expected task statusSummary.');
    assert(
      !Object.prototype.hasOwnProperty.call(firstTask, 'documents'),
      'Document tree tasks must not contain full documents array.',
    );
  });

  await runTest('GET project documents by tag Architettura', async () => {
    const body = await expectJson(
      'GET',
      `/api/v1/projects/${PROJECT_ID}/documents?tag=Architettura`,
      200,
    );
    const documents = getDocuments(body);
    assert(documents.length > 0, 'Expected at least one document.');
    assert(
      documents.every((document) => documentHasTag(document, 'Architettura')),
      'Expected every document to contain tag Architettura.',
    );
  });

  await runTest('GET project documents by search Francesca', async () => {
    const body = await expectJson(
      'GET',
      `/api/v1/projects/${PROJECT_ID}/documents?search=Francesca`,
      200,
    );
    assert(Array.isArray(body.data), 'Expected data array.');
  });

  await runTest('GET project documents with wrong query param returns INVALID_QUERY_PARAM', async () => {
    const body = await expectJson(
      'GET',
      `/api/v1/projects/${PROJECT_ID}/documents?wrongParam=1`,
      400,
    );
    assert(body.code === 'INVALID_QUERY_PARAM', `Expected INVALID_QUERY_PARAM, got ${body.code}.`);
  });

  await runTest('GET DOC-001 detail returns public fileInfo only', async () => {
    const body = await expectJson(
      'GET',
      `/api/v1/projects/${PROJECT_ID}/documents/${DOCUMENT_ID}`,
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
    const body = await expectJson('GET', `/api/v1/projects/${PROJECT_ID}/documents/DOC-999`, 404);
    assert(body.code === 'DOCUMENT_NOT_FOUND', `Expected DOCUMENT_NOT_FOUND, got ${body.code}.`);
  });

  await runTest('GET invalid document id returns INVALID_DOCUMENT_ID', async () => {
    const body = await expectJson(
      'GET',
      `/api/v1/projects/${PROJECT_ID}/documents/not-existing-document-id`,
      400,
    );
    assert(body.code === 'INVALID_DOCUMENT_ID', `Expected INVALID_DOCUMENT_ID, got ${body.code}.`);
  });

  await runTest('GET DOC-001 file returns 200', async () => {
    const result = await request(
      'GET',
      `/api/v1/projects/${PROJECT_ID}/documents/${DOCUMENT_ID}/file`,
    );
    assert(result.response.status === 200, `Expected status 200, got ${result.response.status}.`);
    assert(String(result.body).length > 0, 'Expected non-empty file response.');
  });

  await runTest('PATCH DOC-001 status to in_review', async () => {
    const body = await expectJson(
      'PATCH',
      `/api/v1/projects/${PROJECT_ID}/documents/${DOCUMENT_ID}`,
      200,
      { status: 'in_review' },
    );
    assert(body.data && body.data.status === 'in_review', 'Expected status in_review.');
  });

  await runTest('PATCH DOC-001 ownerId returns INVALID_DOCUMENT_PATCH', async () => {
    const body = await expectJson(
      'PATCH',
      `/api/v1/projects/${PROJECT_ID}/documents/${DOCUMENT_ID}`,
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
      `/api/v1/projects/${PROJECT_ID}/documents/${DOCUMENT_ID}`,
      200,
    );
    assert(body.data && body.data.status === 'archived', 'Expected status archived.');
  });

  await runTest('PATCH archived DOC-001 returns DOCUMENT_ARCHIVED', async () => {
    const body = await expectJson(
      'PATCH',
      `/api/v1/projects/${PROJECT_ID}/documents/${DOCUMENT_ID}`,
      409,
      { status: 'approved' },
    );
    assert(body.code === 'DOCUMENT_ARCHIVED', `Expected DOCUMENT_ARCHIVED, got ${body.code}.`);
  });

  const failed = results.filter((result) => !result.ok);
  const passed = results.length - failed.length;

  console.log('');
  console.log(`Smoke test summary: ${passed}/${results.length} passed.`);
  console.log('After this smoke test, run npm run db:seed to restore DOC-001.');

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Smoke test failed before completion.');
  console.error(error.stack || error.message || error);
  process.exit(1);
});
