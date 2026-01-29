import { Module } from "@nestjs/common"
import { AppConfigModule } from "./infra/app-config/app-config.module"
import { DatabaseModule } from "./infra/database/database.module"
import { HealthModule } from "./infra/health/health.module"

@Module({
	imports: [AppConfigModule, DatabaseModule, HealthModule],
	controllers: [],
	providers: [],
})
export class AppModule {}
