import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitDocumentSchema1778076000000 implements MigrationInterface {
	name = "InitDocumentSchema1778076000000";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			"CREATE SEQUENCE document_id_seq START WITH 1 INCREMENT BY 1",
		);

		await queryRunner.query(`
			CREATE TABLE document_keys (
				key_type VARCHAR(50) NOT NULL,
				key_value VARCHAR(100) NOT NULL,
				name VARCHAR(200) NOT NULL CHECK (btrim(name) <> ''),
				created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
				CONSTRAINT pk_document_keys PRIMARY KEY (key_type, key_value),
				CONSTRAINT chk_document_keys_key_type_not_empty CHECK (btrim(key_type) <> ''),
				CONSTRAINT chk_document_keys_key_value_not_empty CHECK (btrim(key_value) <> '')
			)
		`);

		await queryRunner.query(`
			CREATE TABLE document_sub_keys (
				key_type VARCHAR(50) NOT NULL,
				key_value VARCHAR(100) NOT NULL,
				sub_key VARCHAR(100) NOT NULL,
				parent_sub_key VARCHAR(100) NULL,
				name VARCHAR(200) NOT NULL CHECK (btrim(name) <> ''),
				created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
				CONSTRAINT pk_document_sub_keys PRIMARY KEY (key_type, key_value, sub_key),
				CONSTRAINT fk_document_sub_keys_key FOREIGN KEY (key_type, key_value)
					REFERENCES document_keys(key_type, key_value)
					ON DELETE RESTRICT,
				CONSTRAINT fk_document_sub_keys_parent FOREIGN KEY (key_type, key_value, parent_sub_key)
					REFERENCES document_sub_keys(key_type, key_value, sub_key)
					ON DELETE RESTRICT,
				CONSTRAINT chk_document_sub_keys_sub_key_not_empty CHECK (btrim(sub_key) <> ''),
				CONSTRAINT chk_document_sub_keys_parent_not_self CHECK (parent_sub_key IS NULL OR parent_sub_key <> sub_key)
			)
		`);

		await queryRunner.query(`
			CREATE TABLE documents (
				id VARCHAR(30) NOT NULL,
				key_type VARCHAR(50) NOT NULL,
				key_value VARCHAR(100) NOT NULL,
				sub_key VARCHAR(100) NOT NULL,
				document_key VARCHAR(150) NOT NULL,
				metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
				status VARCHAR(30) NOT NULL CHECK (status IN ('draft', 'in_review', 'approved', 'archived')),
				file_info JSONB NOT NULL,
				checksum_sha256 VARCHAR(64) NOT NULL,
				version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
				created_at TIMESTAMPTZ NOT NULL,
				updated_at TIMESTAMPTZ NULL,
				archived_at TIMESTAMPTZ,
				CONSTRAINT pk_documents PRIMARY KEY (id),
				CONSTRAINT fk_documents_sub_key FOREIGN KEY (key_type, key_value, sub_key)
					REFERENCES document_sub_keys(key_type, key_value, sub_key)
					ON DELETE RESTRICT,
				CONSTRAINT uq_documents_logical_key UNIQUE (key_type, key_value, sub_key, document_key),
				CONSTRAINT chk_documents_id_format CHECK (id ~ '^DOC-[0-9]{3,}$'),
				CONSTRAINT chk_documents_document_key_not_empty CHECK (btrim(document_key) <> ''),
				CONSTRAINT chk_documents_metadata CHECK (
					jsonb_typeof(metadata) = 'object'
					AND metadata ? 'title'
					AND jsonb_typeof(metadata->'title') = 'string'
					AND btrim(metadata->>'title') <> ''
				),
				CONSTRAINT chk_documents_checksum_sha256 CHECK (checksum_sha256 ~ '^[a-f0-9]{64}$'),
				CONSTRAINT chk_documents_file_info CHECK (
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
				CONSTRAINT chk_documents_archived_at_status CHECK (
					(status = 'archived' AND archived_at IS NOT NULL)
					OR (status <> 'archived' AND archived_at IS NULL)
				)
			)
		`);

		await queryRunner.query(`
			CREATE TABLE tags (
				name VARCHAR(100) NOT NULL,
				created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
				CONSTRAINT pk_tags PRIMARY KEY (name),
				CONSTRAINT chk_tags_name_not_empty CHECK (length(trim(name)) > 0)
			)
		`);

		await queryRunner.query(`
			CREATE TABLE document_tags (
				document_id VARCHAR(30) NOT NULL,
				tag_name VARCHAR(100) NOT NULL,
				CONSTRAINT pk_document_tags PRIMARY KEY (document_id, tag_name),
				CONSTRAINT fk_document_tags_document FOREIGN KEY (document_id)
					REFERENCES documents(id)
					ON DELETE CASCADE,
				CONSTRAINT fk_document_tags_tag FOREIGN KEY (tag_name)
					REFERENCES tags(name)
					ON DELETE RESTRICT
					ON UPDATE CASCADE
			)
		`);

		await queryRunner.query(
			"CREATE INDEX idx_document_keys_name ON document_keys(name)",
		);
		await queryRunner.query(
			"CREATE INDEX idx_document_sub_keys_key ON document_sub_keys(key_type, key_value)",
		);
		await queryRunner.query(
			"CREATE INDEX idx_document_sub_keys_parent ON document_sub_keys(key_type, key_value, parent_sub_key)",
		);
		await queryRunner.query(
			"CREATE INDEX idx_document_sub_keys_name ON document_sub_keys(name)",
		);
		await queryRunner.query(
			"CREATE INDEX idx_documents_key ON documents(key_type, key_value)",
		);
		await queryRunner.query(
			"CREATE INDEX idx_documents_sub_key ON documents(key_type, key_value, sub_key)",
		);
		await queryRunner.query(
			"CREATE INDEX idx_documents_document_key ON documents(document_key)",
		);
		await queryRunner.query(
			"CREATE INDEX idx_documents_status ON documents(status)",
		);
		await queryRunner.query(
			"CREATE INDEX idx_documents_created_at ON documents(created_at)",
		);
		await queryRunner.query(
			"CREATE INDEX idx_documents_updated_at ON documents(updated_at)",
		);
		await queryRunner.query("CREATE INDEX idx_tags_name ON tags(name)");
		await queryRunner.query(
			"CREATE UNIQUE INDEX uq_tags_lower_name ON tags (lower(name))",
		);
		await queryRunner.query(
			"CREATE INDEX idx_document_tags_document_id ON document_tags(document_id)",
		);
		await queryRunner.query(
			"CREATE INDEX idx_document_tags_tag_name ON document_tags(tag_name)",
		);
		await queryRunner.query(
			"CREATE INDEX idx_document_tags_lower_tag_name ON document_tags (lower(tag_name))",
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query("DROP TABLE IF EXISTS document_tags CASCADE");
		await queryRunner.query("DROP TABLE IF EXISTS document_versions CASCADE");
		await queryRunner.query("DROP TABLE IF EXISTS documents CASCADE");
		await queryRunner.query("DROP TABLE IF EXISTS tags CASCADE");
		await queryRunner.query("DROP TABLE IF EXISTS owners CASCADE");
		await queryRunner.query("DROP TABLE IF EXISTS document_sub_keys CASCADE");
		await queryRunner.query("DROP TABLE IF EXISTS document_keys CASCADE");
		await queryRunner.query("DROP SEQUENCE IF EXISTS document_id_seq");
	}
}
