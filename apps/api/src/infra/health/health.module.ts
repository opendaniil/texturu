import { Module } from "@nestjs/common"
import { TerminusModule } from "@nestjs/terminus"
import { HealthController } from "./health.controller"
import { KyselyHealthIndicator } from "./kysely.health"

@Module({
	imports: [TerminusModule],
	controllers: [HealthController],
	providers: [KyselyHealthIndicator],
})
export class HealthModule {}
