import { BullModule } from "@nestjs/bullmq"
import { Global, Module } from "@nestjs/common"
import { AppConfigModule } from "../app-config/app-config.module"
import { AppConfigService } from "../app-config/app-config.service"

export const QUEUES = {
	VIDEO_JOB: "video-job",
} as const

@Global()
@Module({
	imports: [
		BullModule.forRootAsync({
			imports: [AppConfigModule],
			inject: [AppConfigService],
			useFactory: (cfg: AppConfigService) => ({
				connection: {
					host: cfg.get("REDIS_HOST"),
					port: cfg.get("REDIS_PORT"),
				},
				prefix: "bull",
			}),
		}),
	],
	exports: [BullModule],
})
export class QueueModule {}
