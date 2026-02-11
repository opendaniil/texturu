import { BullModule } from "@nestjs/bullmq"
import { Module } from "@nestjs/common"
import { QUEUES } from "src/infra/queue/queue.module"
import { VideoRepo } from "../video/video.repo"
import { VideoCaptionRepo } from "../video/video-caption.repo"
import { FetchCaptionsWorker } from "./fetch-captions.worker"
import { GenerateArticleWorker } from "./generate-article.worker"
import { MastraService } from "./mastra.service"
import { VideoJobRepo } from "./video-job.repo"
import { VideoJobsService } from "./video-jobs.service"

@Module({
	imports: [
		BullModule.registerQueue({ name: QUEUES.FETCHING_CAPTIONS }),
		BullModule.registerQueue({ name: QUEUES.GENERATE_ARTICLE }),
	],
	providers: [
		VideoRepo,
		VideoCaptionRepo,
		VideoJobRepo,
		VideoJobsService,
		FetchCaptionsWorker,
		MastraService,
		GenerateArticleWorker,
	],
	exports: [VideoJobsService],
})
export class VideoJobsModule {}
