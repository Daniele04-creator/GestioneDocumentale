import { Controller, Get } from "@nestjs/common";
import { HealthService } from "../services/health.service";

@Controller("api/v1/health")
export class HealthController {
	constructor(private readonly healthService: HealthService) {}

	@Get()
	getHealth() {
		return this.healthService.getHealth();
	}
}
