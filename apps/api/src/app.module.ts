import { Module } from "@nestjs/common"
import { APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core"
import { ZodSerializerInterceptor, ZodValidationPipe } from "nestjs-zod"
import { AppConfigModule } from "./infra/app-config/app-config.module"
import { DatabaseModule } from "./infra/database/database.module"
import { HealthModule } from "./infra/health/health.module"
import { QueueModule } from "./infra/queue/queue.module"
import { VideoModule } from "./modules/video"

@Module({
	imports: [
		AppConfigModule,
		DatabaseModule,
		QueueModule,
		HealthModule,
		VideoModule,
	],
	controllers: [],
	providers: [
		{
			provide: APP_PIPE,
			useClass: ZodValidationPipe,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: ZodSerializerInterceptor,
		},
	],
})
export class AppModule {}
