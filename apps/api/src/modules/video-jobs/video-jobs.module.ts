import { BullModule } from "@nestjs/bullmq"
import { Module } from "@nestjs/common"
import { QUEUES } from "src/infra/queue/queue.module"
import { VideoRepo } from "../video/video.repo"
import { VideoJobRepo } from "./video-job.repo"
import { VideoJobWorker } from "./video-job.worker"
import { VideoJobsService } from "./video-jobs.service"

@Module({
	imports: [BullModule.registerQueue({ name: QUEUES.VIDEO_JOB })],
	providers: [VideoRepo, VideoJobRepo, VideoJobsService, VideoJobWorker],
	exports: [VideoJobsService],
})
export class VideoJobsModule {}
