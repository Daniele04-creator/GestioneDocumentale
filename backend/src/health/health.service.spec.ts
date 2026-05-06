import { HealthService } from "./health.service";

describe("HealthService", () => {
	it("returns service status", () => {
		const service = new HealthService();
		const result = service.getHealth();

		expect(result.status).toBe("ok");
		expect(typeof result.timestamp).toBe("string");
	});
});
