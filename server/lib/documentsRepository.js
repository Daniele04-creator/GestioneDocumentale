'use strict';

const database = require('./database');

async function findAll(filters) {
  const where = [];
  const params = [];

  addTextSearchFilter(where, params, filters.search);
  addPlainFilter(where, params, 'd.status', filters.status);
  addPlainFilter(where, params, 'pr.id', filters.projectId);
  addPlainFilter(where, params, 'p.id', filters.packageId);
  addPlainFilter(where, params, 't.id', filters.taskId);
  addPlainFilter(where, params, 'o.id', filters.ownerId);
  addTagFilter(where, params, filters.tag);

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const result = await database.query(
    `
      SELECT ${documentSelectColumnsSql()}
      ${documentFromSql()}
      ${whereSql}
      ORDER BY COALESCE(d.updated_at, d.created_at) DESC
    `,
    params,
  );

  return addTagsToDocuments(result.rows.map(mapDocumentRow));
}

async function findByProjectAndId(projectId, documentId) {
  const result = await database.query(
    `
      SELECT ${documentSelectColumnsSql()}
      ${documentFromSql()}
      WHERE pr.id = $1
        AND d.id = $2
    `,
    [projectId, documentId],
  );

  if (!result.rows[0]) {
    return undefined;
  }

  const documents = await addTagsToDocuments([mapDocumentRow(result.rows[0])]);
  return documents[0];
}

async function findFileInfoByProjectAndId(projectId, documentId) {
  const result = await database.query(
    `
      SELECT d.file_info
      ${documentFromSql()}
      WHERE pr.id = $1
        AND d.id = $2
    `,
    [projectId, documentId],
  );

  return result.rows[0] ? result.rows[0].file_info : undefined;
}

async function findDocumentTreeByProject(projectId) {
  const result = await database.query(
    `
      SELECT
        pr.id AS project_id,
        pr.name AS project_name,
        p.id AS package_id,
        p.name AS package_name,
        pp.id AS parent_package_id,
        pp.name AS parent_package_name,
        t.id AS task_id,
        t.name AS task_name,
        COUNT(d.id)::int AS document_count,
        COUNT(d.id) FILTER (WHERE d.status = 'draft')::int AS draft_count,
        COUNT(d.id) FILTER (WHERE d.status = 'in_review')::int AS in_review_count,
        COUNT(d.id) FILTER (WHERE d.status = 'approved')::int AS approved_count,
        COUNT(d.id) FILTER (WHERE d.status = 'archived')::int AS archived_count
      FROM documents d
      JOIN tasks t ON d.task_id = t.id
      JOIN packages p ON t.package_id = p.id
      JOIN projects pr ON p.project_id = pr.id
      LEFT JOIN packages pp ON p.parent_package_id = pp.id
      WHERE pr.id = $1
      GROUP BY
        pr.id,
        pr.name,
        p.id,
        p.name,
        pp.id,
        pp.name,
        t.id,
        t.name
      ORDER BY p.name, t.name
    `,
    [projectId],
  );

  return result.rows;
}

async function projectExists(projectId) {
  const result = await database.query(
    'SELECT 1 FROM projects WHERE id = $1 LIMIT 1',
    [projectId],
  );

  return result.rowCount > 0;
}

async function updateForProject(projectId, documentId, changes) {
  const setClauses = [];
  const values = [];

  addUpdateField(setClauses, values, 'title', changes.title);
  addUpdateField(setClauses, values, 'description', changes.description);
  addUpdateField(setClauses, values, 'status', changes.status);
  addUpdateField(setClauses, values, 'archived_at', changes.archivedAt);

  if (setClauses.length === 0) {
    return undefined;
  }

  values.push(changes.updatedAt || new Date().toISOString());
  setClauses.push(`updated_at = $${values.length}`);

  values.push(documentId);
  const documentIdParam = values.length;

  values.push(projectId);
  const projectIdParam = values.length;

  const result = await database.query(
    `
      UPDATE documents d
      SET ${setClauses.join(', ')}
      WHERE d.id = $${documentIdParam}
        AND EXISTS (
          SELECT 1
          FROM tasks t
          JOIN packages p ON t.package_id = p.id
          JOIN projects pr ON p.project_id = pr.id
          WHERE t.id = d.task_id
            AND pr.id = $${projectIdParam}
        )
      RETURNING *
    `,
    values,
  );

  return result.rows[0] ? findByProjectAndId(projectId, documentId) : undefined;
}

async function addTagsToDocuments(documents) {
  if (documents.length === 0) {
    return documents;
  }

  const documentIds = documents.map((document) => document.id);
  const result = await database.query(
    `
      SELECT
        dt.document_id,
        dt.tag_name
      FROM document_tags dt
      WHERE dt.document_id = ANY($1::varchar[])
      ORDER BY dt.tag_name
    `,
    [documentIds],
  );

  const tagsByDocumentId = new Map();

  for (const row of result.rows) {
    if (!tagsByDocumentId.has(row.document_id)) {
      tagsByDocumentId.set(row.document_id, []);
    }

    tagsByDocumentId.get(row.document_id).push({
      name: row.tag_name,
    });
  }

  return documents.map((document) => ({
    ...document,
    tags: tagsByDocumentId.get(document.id) || [],
  }));
}

function addTextSearchFilter(where, params, search) {
  if (!search) {
    return;
  }

  params.push(`%${search}%`);
  where.push(`(
    d.id ILIKE $${params.length}
    OR d.title ILIKE $${params.length}
    OR d.description ILIKE $${params.length}
    OR pr.name ILIKE $${params.length}
    OR p.name ILIKE $${params.length}
    OR t.name ILIKE $${params.length}
    OR o.name ILIKE $${params.length}
    OR EXISTS (
      SELECT 1
      FROM document_tags search_dt
      WHERE search_dt.document_id = d.id
        AND search_dt.tag_name ILIKE $${params.length}
    )
  )`);
}

function addTagFilter(where, params, tagName) {
  if (!tagName) {
    return;
  }

  params.push(tagName);
  where.push(`EXISTS (
    SELECT 1
    FROM document_tags filter_dt
    WHERE filter_dt.document_id = d.id
      AND lower(filter_dt.tag_name) = lower($${params.length})
  )`);
}

function addPlainFilter(where, params, fieldName, value) {
  if (!value) {
    return;
  }

  params.push(value);
  where.push(`${fieldName} = $${params.length}`);
}

function addUpdateField(setClauses, values, columnName, value) {
  if (value === undefined) {
    return;
  }

  values.push(value);
  setClauses.push(`${columnName} = $${values.length}`);
}

function mapDocumentRow(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    status: row.status,
    project: {
      id: row.project_id,
      name: row.project_name,
    },
    package: {
      id: row.package_id,
      name: row.package_name,
    },
    parentPackage: row.parent_package_id
      ? {
          id: row.parent_package_id,
          name: row.parent_package_name,
        }
      : null,
    task: {
      id: row.task_id,
      name: row.task_name,
    },
    owner: {
      id: row.owner_id,
      name: row.owner_name,
    },
    fileInfo: sanitizePublicFileInfo(row.file_info),
    version: row.version,
    createdAt: toIsoString(row.created_at),
    updatedAt: row.updated_at ? toIsoString(row.updated_at) : null,
    archivedAt: row.archived_at ? toIsoString(row.archived_at) : null,
  };
}

function sanitizePublicFileInfo(fileInfo) {
  if (!fileInfo) {
    return undefined;
  }

  return {
    fileName: fileInfo.fileName,
    mimeType: fileInfo.mimeType,
    sizeBytes: fileInfo.sizeBytes,
  };
}

function documentSelectColumnsSql() {
  return `
    d.id,
    d.title,
    d.description,
    d.status,
    d.file_info,
    d.version,
    d.created_at,
    d.updated_at,
    d.archived_at,
    o.id AS owner_id,
    o.name AS owner_name,
    pr.id AS project_id,
    pr.name AS project_name,
    p.id AS package_id,
    p.name AS package_name,
    pp.id AS parent_package_id,
    pp.name AS parent_package_name,
    t.id AS task_id,
    t.name AS task_name
  `;
}

function documentFromSql() {
  return `
    FROM documents d
    JOIN tasks t ON d.task_id = t.id
    JOIN packages p ON t.package_id = p.id
    JOIN projects pr ON p.project_id = pr.id
    JOIN owners o ON d.owner_id = o.id
    LEFT JOIN packages pp ON p.parent_package_id = pp.id
  `;
}

function toIsoString(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

module.exports = {
  findAll,
  findByProjectAndId,
  findFileInfoByProjectAndId,
  findDocumentTreeByProject,
  projectExists,
  updateForProject,
};
