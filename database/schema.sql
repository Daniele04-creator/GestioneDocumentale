DROP TABLE IF EXISTS document_tags CASCADE;
DROP TABLE IF EXISTS document_versions CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS owners CASCADE;
DROP TABLE IF EXISTS document_sub_keys CASCADE;
DROP TABLE IF EXISTS document_keys CASCADE;
DROP SEQUENCE IF EXISTS document_id_seq;

CREATE SEQUENCE document_id_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE document_keys (
  key_type VARCHAR(50) NOT NULL,
  key_value VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL CHECK (btrim(name) <> ''),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (key_type, key_value),
  CONSTRAINT chk_document_keys_key_type_not_empty CHECK (btrim(key_type) <> ''),
  CONSTRAINT chk_document_keys_key_value_not_empty CHECK (btrim(key_value) <> '')
);

CREATE TABLE document_sub_keys (
  key_type VARCHAR(50) NOT NULL,
  key_value VARCHAR(100) NOT NULL,
  sub_key VARCHAR(100) NOT NULL,
  parent_sub_key VARCHAR(100) NULL,
  name VARCHAR(200) NOT NULL CHECK (btrim(name) <> ''),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (key_type, key_value, sub_key),
  FOREIGN KEY (key_type, key_value)
    REFERENCES document_keys(key_type, key_value)
    ON DELETE RESTRICT,
  FOREIGN KEY (key_type, key_value, parent_sub_key)
    REFERENCES document_sub_keys(key_type, key_value, sub_key)
    ON DELETE RESTRICT,
  CONSTRAINT chk_document_sub_keys_sub_key_not_empty CHECK (btrim(sub_key) <> ''),
  CONSTRAINT chk_document_sub_keys_parent_not_self CHECK (parent_sub_key IS NULL OR parent_sub_key <> sub_key)
);

CREATE TABLE owners (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_owners_name_not_empty CHECK (length(trim(name)) > 0)
);

CREATE TABLE documents (
  id VARCHAR(30) PRIMARY KEY,
  key_type VARCHAR(50) NOT NULL,
  key_value VARCHAR(100) NOT NULL,
  sub_key VARCHAR(100) NOT NULL,
  document_key VARCHAR(150) NOT NULL,
  template_id VARCHAR(150) NULL,
  template_name VARCHAR(200) NULL,
  owner_id VARCHAR(100) NOT NULL REFERENCES owners(id) ON DELETE RESTRICT,
  title VARCHAR(200) NOT NULL CHECK (btrim(title) <> ''),
  description TEXT,
  status VARCHAR(30) NOT NULL CHECK (status IN ('draft', 'in_review', 'approved', 'archived')),
  file_info JSONB NOT NULL,
  checksum_sha256 VARCHAR(64) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NULL,
  archived_at TIMESTAMPTZ,
  CONSTRAINT fk_documents_sub_key FOREIGN KEY (key_type, key_value, sub_key)
    REFERENCES document_sub_keys(key_type, key_value, sub_key)
    ON DELETE RESTRICT,
  CONSTRAINT uq_documents_logical_key UNIQUE (key_type, key_value, sub_key, document_key),
  CONSTRAINT chk_documents_id_format CHECK (id ~ '^DOC-[0-9]{3,}$'),
  CONSTRAINT chk_documents_document_key_not_empty CHECK (btrim(document_key) <> ''),
  CONSTRAINT chk_documents_checksum_sha256 CHECK (checksum_sha256 ~ '^[a-f0-9]{64}$'),
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

CREATE TABLE document_versions (
  document_id VARCHAR(30) NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version >= 1),
  file_info JSONB NOT NULL,
  checksum_sha256 VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (document_id, version),
  CONSTRAINT chk_document_versions_checksum_sha256 CHECK (checksum_sha256 ~ '^[a-f0-9]{64}$'),
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

CREATE INDEX IF NOT EXISTS idx_document_keys_name ON document_keys(name);
CREATE INDEX IF NOT EXISTS idx_document_sub_keys_key ON document_sub_keys(key_type, key_value);
CREATE INDEX IF NOT EXISTS idx_document_sub_keys_parent ON document_sub_keys(key_type, key_value, parent_sub_key);
CREATE INDEX IF NOT EXISTS idx_document_sub_keys_name ON document_sub_keys(name);
CREATE INDEX IF NOT EXISTS idx_owners_name ON owners(name);
CREATE INDEX IF NOT EXISTS idx_documents_key ON documents(key_type, key_value);
CREATE INDEX IF NOT EXISTS idx_documents_sub_key ON documents(key_type, key_value, sub_key);
CREATE INDEX IF NOT EXISTS idx_documents_document_key ON documents(document_key);
CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at);
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE UNIQUE INDEX IF NOT EXISTS uq_tags_lower_name ON tags (lower(name));
CREATE INDEX IF NOT EXISTS idx_document_tags_document_id ON document_tags(document_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_tag_name ON document_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_document_tags_lower_tag_name ON document_tags (lower(tag_name));
