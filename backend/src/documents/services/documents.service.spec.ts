import { DocumentsRepository } from "../repositories/documents.repository";
import { DocumentsService } from "./documents.service";

describe("DocumentsService", () => {
	it("builds a lightweight document tree", async () => {
		const repository = {
			projectExists: jest.fn().mockResolvedValue(true),
			findDocumentTreeByProject: jest.fn().mockResolvedValue([
				{
					package_id: "package-001",
					package_name: "Documentazione requisiti",
					parent_package_id: null,
					parent_package_name: null,
					task_id: "task-001",
					task_name: "Redazione Specifica SRS",
					document_count: 1,
					draft_count: 1,
					in_review_count: 0,
					approved_count: 0,
					archived_count: 0,
				},
			]),
		} as unknown as DocumentsRepository;

		const service = new DocumentsService(repository);
		const response = await service.getProjectDocumentTree("project-001");

		expect(response.meta.totalPackages).toBe(1);
		expect(response.meta.totalTasks).toBe(1);
		expect(response.meta.totalDocuments).toBe(1);
		expect(response.data[0].tasks[0]).not.toHaveProperty("documents");
	});
});
