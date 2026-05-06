import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryColumn,
} from "typeorm";
import { DocumentSubKey } from "./document-sub-key.entity";

@Entity("document_keys")
export class DocumentKey {
	@PrimaryColumn({ name: "key_type", type: "varchar", length: 50 })
	keyType!: string;

	@PrimaryColumn({ name: "key_value", type: "varchar", length: 100 })
	key!: string;

	@Column({ type: "varchar", length: 200 })
	name!: string;

	@CreateDateColumn({ name: "created_at", type: "timestamptz" })
	createdAt!: Date;

	@OneToMany(
		() => DocumentSubKey,
		(documentSubKey) => documentSubKey.documentKey,
	)
	subKeys!: DocumentSubKey[];
}
