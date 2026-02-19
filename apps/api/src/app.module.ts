import { Module } from "@nestjs/common"
import { APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core"
import { ZodSerializerInterceptor } from "nestjs-zod"
import { ZodValidationPipe } from "./common/pipes/zod-validation.pipe"
import { AppConfigModule } from "./infra/app-config/app-config.module"
import { DatabaseModule } from "./infra/database/database.module"
import { HealthModule } from "./infra/health/health.module"
import { QueueModule } from "./infra/queue/queue.module"
import { ChatModule } from "./modules/chat"
import { VideoModule } from "./modules/video"

@Module({
	imports: [
		AppConfigModule,
		DatabaseModule,
		QueueModule,
		HealthModule,
		ChatModule,
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
