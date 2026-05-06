DROP TABLE IF EXISTS document_tags CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS owners CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

CREATE TABLE projects (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(200) NOT NULL CHECK (btrim(name) <> ''),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE packages (
  id VARCHAR(100) PRIMARY KEY,
  project_id VARCHAR(100) NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  parent_package_id VARCHAR(100) NULL REFERENCES packages(id) ON DELETE RESTRICT,
  name VARCHAR(200) NOT NULL CHECK (btrim(name) <> ''),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (parent_package_id IS NULL OR parent_package_id <> id)
);

CREATE TABLE owners (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_owners_name_not_empty CHECK (length(trim(name)) > 0)
);

CREATE TABLE documents (
  id VARCHAR(30) PRIMARY KEY,
  package_id VARCHAR(100) NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,
  owner_id VARCHAR(100) NOT NULL REFERENCES owners(id) ON DELETE RESTRICT,
  title VARCHAR(200) NOT NULL CHECK (btrim(title) <> ''),
  description TEXT,
  status VARCHAR(30) NOT NULL CHECK (status IN ('draft', 'in_review', 'approved', 'archived')),
  file_info JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NULL,
  archived_at TIMESTAMPTZ,
  CONSTRAINT chk_documents_id_format CHECK (id ~ '^DOC-[0-9]{3}$'),
  CHECK (
    file_info ? 'fileName'
    AND file_info ? 'mimeType'
    AND file_info ? 'sizeBytes'
    AND file_info ? 'storagePath'
    AND jsonb_typeof(file_info->'fileName') = 'string'
    AND btrim(file_info->>'fileName') <> ''
    AND jsonb_typeof(file_info->'mimeType') = 'string'
    AND btrim(file_info->>'mimeType') <> ''
    AND jsonb_typeof(file_info->'storagePath') = 'string'
    AND btrim(file_info->>'storagePath') <> ''
    AND jsonb_typeof(file_info->'sizeBytes') = 'number'
    AND (file_info->>'sizeBytes')::numeric >= 0
  ),
  CHECK (
    (status = 'archived' AND archived_at IS NOT NULL)
    OR (status <> 'archived' AND archived_at IS NULL)
  )
);

CREATE TABLE tags (
  name VARCHAR(100) PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_tags_name_not_empty CHECK (length(trim(name)) > 0)
);

CREATE TABLE document_tags (
  document_id VARCHAR(30) NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL REFERENCES tags(name) ON DELETE RESTRICT ON UPDATE CASCADE,
  PRIMARY KEY (document_id, tag_name)
);

CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_packages_project_id ON packages(project_id);
CREATE INDEX IF NOT EXISTS idx_packages_parent_package_id ON packages(parent_package_id);
CREATE INDEX IF NOT EXISTS idx_packages_name ON packages(name);
CREATE INDEX IF NOT EXISTS idx_owners_name ON owners(name);
CREATE INDEX IF NOT EXISTS idx_documents_package_id ON documents(package_id);
CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE UNIQUE INDEX IF NOT EXISTS uq_tags_lower_name ON tags (lower(name));
CREATE INDEX IF NOT EXISTS idx_document_tags_document_id ON document_tags(document_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_tag_name ON document_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_document_tags_lower_tag_name ON document_tags (lower(tag_name));
