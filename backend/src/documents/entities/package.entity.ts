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
import { Project } from "./project.entity";

@Entity("packages")
export class Package {
	@PrimaryColumn({ type: "varchar", length: 100 })
	id!: string;

	@Column({ name: "project_id", type: "varchar", length: 100 })
	projectId!: string;

	@Column({
		name: "parent_package_id",
		type: "varchar",
		length: 100,
		nullable: true,
	})
	parentPackageId?: string | null;

	@Column({ type: "varchar", length: 200 })
	name!: string;

	@CreateDateColumn({ name: "created_at", type: "timestamptz" })
	createdAt!: Date;

	@ManyToOne(
		() => Project,
		(project) => project.packages,
	)
	@JoinColumn({ name: "project_id" })
	project!: Project;

	@ManyToOne(
		() => Package,
		(documentPackage) => documentPackage.children,
		{ nullable: true },
	)
	@JoinColumn({ name: "parent_package_id" })
	parentPackage?: Package | null;

	@OneToMany(
		() => Package,
		(documentPackage) => documentPackage.parentPackage,
	)
	children!: Package[];

	@OneToMany(
		() => Document,
		(document) => document.package,
	)
	documents!: Document[];
}
