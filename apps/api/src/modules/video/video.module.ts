import { BullModule } from "@nestjs/bullmq"
import { Module } from "@nestjs/common"
import { QUEUES } from "src/infra/queue/queue.module"
import { VideoController } from "./video.controller"
import { VideoRepo } from "./video.repo"
import { VideoService } from "./video.service"
import { VideoJobRepo } from "./video-job.repo"
import { VideoJobWorker } from "./video-job.worker"

@Module({
	imports: [BullModule.registerQueue({ name: QUEUES.VIDEO_JOB })],
	controllers: [VideoController],
	providers: [VideoService, VideoRepo, VideoJobRepo, VideoJobWorker],
})
export class VideoModule {}
