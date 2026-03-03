import { BullModule } from "@nestjs/bullmq"
import { Module } from "@nestjs/common"
import { FetchCaptionsService } from "./application/fetch-captions.service"
import { FetchInfoService } from "./application/fetch-info.service"
import { GenerateArticleService } from "./application/generate-article.service"
import { MastraService } from "./application/mastra.service"
import { VideoService } from "./application/video.service"
import { QUEUES } from "./application/video-jobs.contract"
import { VideoJobsService } from "./application/video-jobs.service"
import { VideoRepo } from "./data/video.repo"
import { VideoArticleRepo } from "./data/video-article.repo"
import { VideoCaptionRepo } from "./data/video-caption.repo"
import { VideoInfoRepo } from "./data/video-info.repo"
import { VideoController } from "./entrypoint/rest/video.controller"
import { FetchCaptionsWorker } from "./entrypoint/workers/fetch-captions.worker"
import { FetchInfoWorker } from "./entrypoint/workers/fetch-info.worker"
import { GenerateArticleWorker } from "./entrypoint/workers/generate-article.worker"

@Module({
	imports: [
		BullModule.registerQueue({ name: QUEUES.FETCHING_INFO }),
		BullModule.registerQueue({ name: QUEUES.FETCHING_CAPTIONS }),
		BullModule.registerQueue({ name: QUEUES.GENERATE_ARTICLE }),
	],
	controllers: [VideoController],
	providers: [
		VideoService,
		FetchInfoService,
		FetchCaptionsService,
		GenerateArticleService,
		VideoJobsService,
		MastraService,
		VideoRepo,
		VideoInfoRepo,
		VideoCaptionRepo,
		VideoArticleRepo,
		FetchInfoWorker,
		FetchCaptionsWorker,
		GenerateArticleWorker,
	],
	exports: [VideoService, VideoArticleRepo, VideoInfoRepo],
})
export class VideoModule {}
