import { DocumentsRepository } from "../repositories/documents.repository";
import { DocumentsService } from "./documents.service";

describe("DocumentsService", () => {
	it("builds a lightweight document tree", async () => {
		const repository = {
			keyExists: jest.fn().mockResolvedValue(true),
			findDocumentTreeByKey: jest.fn().mockResolvedValue([
				{
					key_type: "project",
					key_value: "PRJ-001",
					key_name: "Management as Code Demo",
					sub_key: "PKG-001",
					sub_key_name: "Documentazione requisiti",
					parent_sub_key: null,
					parent_sub_key_name: null,
					document_count: 1,
					draft_count: 1,
					in_review_count: 0,
					approved_count: 0,
					archived_count: 0,
				},
			]),
		} as unknown as DocumentsRepository;

		const service = new DocumentsService(repository);
		const response = await service.getDocumentTree("project", "PRJ-001");

		expect(response.meta.totalSubKeys).toBe(1);
		expect(response.meta.totalDocuments).toBe(1);
		expect(response.data[0]).not.toHaveProperty("documents");
	});
});
