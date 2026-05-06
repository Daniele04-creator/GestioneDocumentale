import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryColumn,
} from "typeorm";
import { Document } from "./document.entity";

@Entity("owners")
export class Owner {
	@PrimaryColumn({ type: "varchar", length: 100 })
	id!: string;

	@Column({ type: "varchar", length: 200 })
	name!: string;

	@CreateDateColumn({ name: "created_at", type: "timestamptz" })
	createdAt!: Date;

	@OneToMany(
		() => Document,
		(document) => document.owner,
	)
	documents!: Document[];
}
