import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryColumn,
} from "typeorm";
import { Package } from "./package.entity";

@Entity("projects")
export class Project {
	@PrimaryColumn({ type: "varchar", length: 100 })
	id!: string;

	@Column({ type: "varchar", length: 200 })
	name!: string;

	@CreateDateColumn({ name: "created_at", type: "timestamptz" })
	createdAt!: Date;

	@OneToMany(
		() => Package,
		(documentPackage) => documentPackage.project,
	)
	packages!: Package[];
}
