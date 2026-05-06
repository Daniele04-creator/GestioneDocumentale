import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryColumn,
} from "typeorm";
import { DocumentTag } from "./document-tag.entity";
import { Owner } from "./owner.entity";
import { Package } from "./package.entity";

export type DocumentStatus = "draft" | "in_review" | "approved" | "archived";

export type DocumentFileInfo = {
	fileName: string;
	mimeType: string;
	sizeBytes: number;
	storagePath: string;
};

@Entity("documents")
export class Document {
	@PrimaryColumn({ type: "varchar", length: 30 })
	key!: string;

	@Column({ name: "package_id", type: "varchar", length: 100 })
	subkey!: string;

	@Column({ name: "owner_id", type: "varchar", length: 100 })
	ownerId!: string;

	@Column({ type: "varchar", length: 200 })
	title!: string;

	@Column({ type: "text", nullable: true })
	description?: string | null;

	@Column({ type: "varchar", length: 30 })
	status!: DocumentStatus;

	@Column({ name: "file_info", type: "jsonb" })
	fileInfo!: DocumentFileInfo;

	@Column({ type: "integer" })
	version!: number;

	@Column({ name: "created_at", type: "timestamptz" })
	createdAt!: Date;

	@Column({ name: "updated_at", type: "timestamptz", nullable: true })
	updatedAt?: Date | null;

	@Column({ name: "archived_at", type: "timestamptz", nullable: true })
	archivedAt?: Date | null;

	@ManyToOne(
		() => Package,
		(documentPackage) => documentPackage.documents,
	)
	@JoinColumn({ name: "package_id" })
	package!: Package;

	@ManyToOne(
		() => Owner,
		(owner) => owner.documents,
	)
	@JoinColumn({ name: "owner_id" })
	owner!: Owner;

	@OneToMany(
		() => DocumentTag,
		(documentTag) => documentTag.document,
	)
	documentTags!: DocumentTag[];
}
