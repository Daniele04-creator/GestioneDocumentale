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

	it("registers metadata for an existing document file", async () => {
		const createdDocument = {
			id: "DOC-020",
			documentKey: "REPORT-AVANZAMENTO-DEMO",
			metadata: {
				title: "Report avanzamento",
				description: "Documento prodotto da una funzione esterna",
				templateId: "TPL-REPORT",
				templateName: "Template report avanzamento",
			},
			title: "Report avanzamento",
			description: "Documento prodotto da una funzione esterna",
			status: "draft",
			keyType: "project",
			key: { id: "PRJ-001", name: "Management as Code Demo" },
			subKey: {
				id: "PKG-001",
				name: "Documentazione requisiti",
				parentSubKey: null,
			},
			owner: { id: "owner-001", name: "Francesca R" },
			fileInfo: {
				fileName: "report-avanzamento.txt",
				mimeType: "text/plain",
				sizeBytes: 210,
			},
			checksumSha256:
				"0000000000000000000000000000000000000000000000000000000000000000",
			version: 1,
			createdAt: new Date().toISOString(),
			updatedAt: null,
			archivedAt: null,
			tags: [{ name: "Report" }],
		};
		const repository = {
			keyExists: jest.fn().mockResolvedValue(true),
			subKeyExists: jest.fn().mockResolvedValue(true),
			ownerExists: jest.fn().mockResolvedValue(true),
			upsertGeneratedDocument: jest.fn().mockResolvedValue({
				document: createdDocument,
				storedFileUsed: true,
			}),
		} as unknown as DocumentsRepository;

		const service = new DocumentsService(repository);
		const serviceWithPrivateMethods = service as unknown as {
			storeUploadedDocumentFile: jest.Mock;
		};
		jest
			.spyOn(serviceWithPrivateMethods, "storeUploadedDocumentFile")
			.mockResolvedValue({
				absolutePath: "storage/documents/uploaded-report-avanzamento.txt",
				fileInfo: {
					fileName: "uploaded-report-avanzamento.txt",
					mimeType: "text/plain",
					sizeBytes: 210,
					storagePath: "storage/documents/uploaded-report-avanzamento.txt",
				},
				checksumSha256:
					"0000000000000000000000000000000000000000000000000000000000000000",
			});

		const response = await service.createDocument(
			"project",
			"PRJ-001",
			{
				subKey: "PKG-001",
				documentKey: "REPORT-AVANZAMENTO-DEMO",
				templateId: "TPL-REPORT",
				templateName: "Template report avanzamento",
				title: "Report avanzamento",
				description: "Documento prodotto da una funzione esterna",
				ownerId: "owner-001",
				tags: ["Report"],
			},
			{
				originalname: "report-avanzamento.txt",
				mimetype: "text/plain",
				size: 210,
				buffer: Buffer.from("demo"),
			},
		);

		expect(response.id).toBe("DOC-020");
		expect(repository.upsertGeneratedDocument).toHaveBeenCalledWith(
			"project",
			"PRJ-001",
			expect.objectContaining({
				subKey: "PKG-001",
				documentKey: "REPORT-AVANZAMENTO-DEMO",
				checksumSha256:
					"0000000000000000000000000000000000000000000000000000000000000000",
				metadata: {
					title: "Report avanzamento",
					description: "Documento prodotto da una funzione esterna",
					templateId: "TPL-REPORT",
					templateName: "Template report avanzamento",
				},
				tags: ["Report"],
			}),
		);
	});
});
