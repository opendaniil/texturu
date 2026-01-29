import { Controller, Get } from "@nestjs/common"
import { HealthCheck, HealthCheckService } from "@nestjs/terminus"
import { KyselyHealthIndicator } from "./kysely.health"

@Controller("health")
export class HealthController {
	constructor(
		private readonly health: HealthCheckService,
		private readonly db: KyselyHealthIndicator
	) {}

	@Get("live")
	@HealthCheck()
	live() {
		return this.health.check([])
	}

	@Get("ready")
	@HealthCheck()
	ready() {
		return this.health.check([() => this.db.isHealthy("database", 1500)])
	}
}
