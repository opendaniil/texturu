import { Module } from "@nestjs/common"
import { VideoArticleRepo } from "../video/data/video-article.repo"
import { VideoInfoRepo } from "../video/data/video-info.repo"
import { ChatService } from "./application/chat.service"
import { ChatController } from "./entrypoint/rest/chat.controller"

@Module({
	controllers: [ChatController],
	providers: [ChatService, VideoArticleRepo, VideoInfoRepo],
})
export class ChatModule {}
