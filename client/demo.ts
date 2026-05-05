import {
  Configuration,
  HealthApi,
  ProjectDocumentsApi,
} from './index';

const basePath = process.env.API_BASE_URL || 'http://localhost:3000';
const projectId = 'project-001';
const documentId = 'DOC-001';

const configuration = new Configuration({ basePath });
const fetchApi = ((requestUrl: string, init?: any) =>
  fetch(requestUrl, init)) as any;
const healthApi = new HealthApi(configuration, undefined, fetchApi);
const documentsApi = new ProjectDocumentsApi(configuration, undefined, fetchApi);

async function main() {
  const health = await healthApi.healthControllerGetHealth();
  console.log('health:', health.status);

  const list = await documentsApi.projectDocumentsControllerListProjectDocuments(projectId);
  console.log('project documents:', list.meta.totalDocuments);

  const architetturaFilter = await documentsApi.projectDocumentsControllerListProjectDocuments(
    projectId,
    undefined,
    undefined,
    'Architettura',
  );
  assertDocumentsHaveTag(architetturaFilter, 'Architettura');
  console.log('tag Architettura:', architetturaFilter.meta.totalDocuments);

  const qaFilter = await documentsApi.projectDocumentsControllerListProjectDocuments(
    projectId,
    undefined,
    undefined,
    'QA',
  );
  assertDocumentsHaveTag(qaFilter, 'QA');
  console.log('tag QA:', qaFilter.meta.totalDocuments);

  const missingTagFilter = await documentsApi.projectDocumentsControllerListProjectDocuments(
    projectId,
    undefined,
    undefined,
    'TagInesistente',
  );
  assertEmptyResult(missingTagFilter, 'missing tag');
  console.log('tag TagInesistente:', missingTagFilter.meta.totalDocuments);

  const ownerSearch = await documentsApi.projectDocumentsControllerListProjectDocuments(
    projectId,
    'Francesca',
  );
  assertHasDocuments(ownerSearch, 'search Francesca');
  console.log('search Francesca:', ownerSearch.meta.totalDocuments);

  const apiSearch = await documentsApi.projectDocumentsControllerListProjectDocuments(
    projectId,
    'api',
  );
  assertHasDocuments(apiSearch, 'search api');
  console.log('search api:', apiSearch.meta.totalDocuments);

  await expectInvalidQueryParam();

  const detail = await documentsApi.projectDocumentsControllerGetProjectDocumentById(
    documentId,
    projectId,
  );
  console.log('document detail:', detail.data.id, detail.data.title);

  const updated = await documentsApi.projectDocumentsControllerUpdateProjectDocument(
    { status: 'in_review' as any },
    documentId,
    projectId,
  );
  console.log('updated status:', updated.data.status);

  const archived = await documentsApi.projectDocumentsControllerArchiveProjectDocument(
    documentId,
    projectId,
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
  try {
    await documentsApi.projectDocumentsControllerListProjectDocuments(
      projectId,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { query: { wrongParam: '1' } },
    );
    throw new Error('Expected 400 INVALID_QUERY_PARAM, but the request succeeded.');
  } catch (error: any) {
    if (error.status !== 400) {
      throw error;
    }

    const body = await error.json();
    if (body.code !== 'INVALID_QUERY_PARAM') {
      throw new Error(`Expected INVALID_QUERY_PARAM, got ${body.code}.`);
    }
    console.log('invalid query:', error.status, body.code);
  }
}

async function expectArchivedConflict() {
  try {
    await documentsApi.projectDocumentsControllerUpdateProjectDocument(
      { status: 'approved' as any },
      documentId,
      projectId,
    );
    throw new Error('Expected 409 DOCUMENT_ARCHIVED, but the request succeeded.');
  } catch (error: any) {
    if (error.status !== 409) {
      throw error;
    }

    const body = await error.json();
    console.log('archived conflict:', error.status, body.code);
  }
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
