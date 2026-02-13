import { BullModule } from "@nestjs/bullmq"
import { Module } from "@nestjs/common"
import { QUEUES } from "src/infra/queue/queue.module"
import { VideoRepo } from "../video/video.repo"
import { VideoArticleRepo } from "../video/video-article.repo"
import { VideoCaptionRepo } from "../video/video-caption.repo"
import { FetchCaptionsWorker } from "./fetch-captions.worker"
import { FetchInfoWorker } from "./fetch-info.worker"
import { GenerateArticleWorker } from "./generate-article.worker"
import { MastraService } from "./mastra.service"
import { VideoJobsService } from "./video-jobs.service"

@Module({
	imports: [
		BullModule.registerQueue({ name: QUEUES.FETCHING_INFO }),
		BullModule.registerQueue({ name: QUEUES.FETCHING_CAPTIONS }),
		BullModule.registerQueue({ name: QUEUES.GENERATE_ARTICLE }),
	],
	providers: [
		VideoRepo,
		VideoArticleRepo,
		VideoCaptionRepo,
		VideoJobsService,
		FetchCaptionsWorker,
		MastraService,
		GenerateArticleWorker,
		FetchInfoWorker,
	],
	exports: [VideoJobsService],
})
export class VideoJobsModule {}
