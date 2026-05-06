import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToOne,
	PrimaryColumn,
} from "typeorm";
import { Document } from "./document.entity";
import { Package } from "./package.entity";

@Entity("tasks")
export class Task {
	@PrimaryColumn({ type: "varchar", length: 100 })
	id!: string;

	@Column({ name: "package_id", type: "varchar", length: 100 })
	packageId!: string;

	@Column({ type: "varchar", length: 200 })
	name!: string;

	@CreateDateColumn({ name: "created_at", type: "timestamptz" })
	createdAt!: Date;

	@ManyToOne(
		() => Package,
		(documentPackage) => documentPackage.tasks,
	)
	@JoinColumn({ name: "package_id" })
	package!: Package;

	@OneToOne(
		() => Document,
		(document) => document.task,
	)
	document?: Document | null;
}
