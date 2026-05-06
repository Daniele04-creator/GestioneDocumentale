import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Document, type DocumentFileInfo } from "./document.entity";

@Entity("document_versions")
export class DocumentVersion {
	@PrimaryColumn({ name: "document_id", type: "varchar", length: 30 })
	documentId!: string;

	@PrimaryColumn({ type: "integer" })
	version!: number;

	@Column({ name: "file_info", type: "jsonb" })
	fileInfo!: DocumentFileInfo;

	@Column({ name: "checksum_sha256", type: "varchar", length: 64 })
	checksumSha256!: string;

	@Column({ name: "created_at", type: "timestamptz" })
	createdAt!: Date;

	@ManyToOne(
		() => Document,
		(document) => document.versions,
	)
	@JoinColumn({ name: "document_id" })
	document!: Document;
}
