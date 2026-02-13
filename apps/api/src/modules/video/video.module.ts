import { Module } from "@nestjs/common"
import { VideoJobsModule } from "../video-jobs/video-jobs.module"
import { VideoController } from "./video.controller"
import { VideoRepo } from "./video.repo"
import { VideoService } from "./video.service"
import { VideoArticleRepo } from "./video-article.repo"

@Module({
	imports: [VideoJobsModule],
	controllers: [VideoController],
	providers: [VideoService, VideoRepo, VideoArticleRepo],
})
export class VideoModule {}
