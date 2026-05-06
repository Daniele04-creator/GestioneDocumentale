import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Document } from "./document.entity";
import { Tag } from "./tag.entity";

@Entity("document_tags")
export class DocumentTag {
	@PrimaryColumn({ name: "document_id", type: "varchar", length: 30 })
	documentId!: string;

	@PrimaryColumn({ name: "tag_name", type: "varchar", length: 100 })
	tagName!: string;

	@ManyToOne(
		() => Document,
		(document) => document.documentTags,
		{ onDelete: "CASCADE" },
	)
	@JoinColumn({ name: "document_id" })
	document!: Document;

	@ManyToOne(
		() => Tag,
		(tag) => tag.documentTags,
		{ onUpdate: "CASCADE" },
	)
	@JoinColumn({ name: "tag_name", referencedColumnName: "name" })
	tag!: Tag;
}
