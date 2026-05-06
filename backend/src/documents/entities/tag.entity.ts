import { CreateDateColumn, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { DocumentTag } from "./document-tag.entity";

@Entity("tags")
export class Tag {
	@PrimaryColumn({ type: "varchar", length: 100 })
	name!: string;

	@CreateDateColumn({ name: "created_at", type: "timestamptz" })
	createdAt!: Date;

	@OneToMany(
		() => DocumentTag,
		(documentTag) => documentTag.tag,
	)
	documentTags!: DocumentTag[];
}
