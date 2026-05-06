import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryColumn,
} from "typeorm";
import { Project } from "./project.entity";
import { Task } from "./task.entity";

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
		() => Task,
		(task) => task.package,
	)
	tasks!: Task[];
}
