import { BullModule } from "@nestjs/bullmq"
import { Module } from "@nestjs/common"
import { QUEUES } from "src/infra/queue/queue.module"
import { VideoCaptionRepo } from "../video/video-caption.repo"
import { VideoRepo } from "../video/video.repo"
import { VideoJobWorker } from "./fetch-captions.worker"
import { VideoJobRepo } from "./video-job.repo"
import { VideoJobsService } from "./video-jobs.service"

@Module({
	imports: [BullModule.registerQueue({ name: QUEUES.FETCH_CAPTIONS })],
	providers: [
		VideoRepo,
		VideoCaptionRepo,
		VideoJobRepo,
		VideoJobsService,
		VideoJobWorker,
	],
	exports: [VideoJobsService],
})
export class VideoJobsModule {}
