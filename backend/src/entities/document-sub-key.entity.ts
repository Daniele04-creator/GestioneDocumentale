import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryColumn,
} from "typeorm";
import { Document } from "./document.entity";
import { DocumentKey } from "./document-key.entity";

@Entity("document_sub_keys")
export class DocumentSubKey {
	@PrimaryColumn({ name: "key_type", type: "varchar", length: 50 })
	keyType!: string;

	@PrimaryColumn({ name: "key_value", type: "varchar", length: 100 })
	key!: string;

	@PrimaryColumn({ name: "sub_key", type: "varchar", length: 100 })
	subKey!: string;

	@Column({
		name: "parent_sub_key",
		type: "varchar",
		length: 100,
		nullable: true,
	})
	parentSubKey?: string | null;

	@Column({ type: "varchar", length: 200 })
	name!: string;

	@CreateDateColumn({ name: "created_at", type: "timestamptz" })
	createdAt!: Date;

	@ManyToOne(
		() => DocumentKey,
		(documentKey) => documentKey.subKeys,
	)
	@JoinColumn([
		{ name: "key_type", referencedColumnName: "keyType" },
		{ name: "key_value", referencedColumnName: "key" },
	])
	documentKey!: DocumentKey;

	@ManyToOne(
		() => DocumentSubKey,
		(documentSubKey) => documentSubKey.children,
		{ nullable: true },
	)
	@JoinColumn([
		{ name: "key_type", referencedColumnName: "keyType" },
		{ name: "key_value", referencedColumnName: "key" },
		{ name: "parent_sub_key", referencedColumnName: "subKey" },
	])
	parent?: DocumentSubKey | null;

	@OneToMany(
		() => DocumentSubKey,
		(documentSubKey) => documentSubKey.parent,
	)
	children!: DocumentSubKey[];

	@OneToMany(
		() => Document,
		(document) => document.documentSubKey,
	)
	documents!: Document[];
}
