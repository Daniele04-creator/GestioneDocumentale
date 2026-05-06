import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryColumn,
} from "typeorm";
import { DocumentSubKey } from "./document-sub-key.entity";
import { DocumentTag } from "./document-tag.entity";

export type DocumentStatus = "draft" | "in_review" | "approved" | "archived";

export type DocumentFileInfo = {
	fileName: string;
	mimeType: string;
	sizeBytes: number;
	storagePath: string;
};

export type DocumentMetadata = {
	title: string;
	description?: string;
	templateId?: string;
	templateName?: string;
	owner?: {
		id?: string;
		name?: string;
		email?: string;
		source?: string;
	};
	source?: Record<string, unknown>;
	[key: string]: unknown;
};

@Entity("documents")
export class Document {
	@PrimaryColumn({ type: "varchar", length: 30 })
	id!: string;

	@Column({ name: "key_type", type: "varchar", length: 50 })
	keyType!: string;

	@Column({ name: "key_value", type: "varchar", length: 100 })
	key!: string;

	@Column({ name: "sub_key", type: "varchar", length: 100 })
	subKey!: string;

	@Column({ name: "document_key", type: "varchar", length: 150 })
	documentKey!: string;

	@Column({ type: "jsonb" })
	metadata!: DocumentMetadata;

	@Column({ type: "varchar", length: 30 })
	status!: DocumentStatus;

	@Column({ name: "file_info", type: "jsonb" })
	fileInfo!: DocumentFileInfo;

	@Column({ name: "checksum_sha256", type: "varchar", length: 64 })
	checksumSha256!: string;

	@Column({ type: "integer" })
	version!: number;

	@Column({ name: "created_at", type: "timestamptz" })
	createdAt!: Date;

	@Column({ name: "updated_at", type: "timestamptz", nullable: true })
	updatedAt?: Date | null;

	@Column({ name: "archived_at", type: "timestamptz", nullable: true })
	archivedAt?: Date | null;

	@ManyToOne(
		() => DocumentSubKey,
		(documentSubKey) => documentSubKey.documents,
	)
	@JoinColumn([
		{ name: "key_type", referencedColumnName: "keyType" },
		{ name: "key_value", referencedColumnName: "key" },
		{ name: "sub_key", referencedColumnName: "subKey" },
	])
	documentSubKey!: DocumentSubKey;

	@OneToMany(
		() => DocumentTag,
		(documentTag) => documentTag.document,
	)
	documentTags!: DocumentTag[];
}
