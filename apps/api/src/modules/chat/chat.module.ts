import { Module } from "@nestjs/common"
import { VideoModule } from "../video/video.module"
import { ChatService } from "./application/chat.service"
import { ChatController } from "./entrypoint/rest/chat.controller"

@Module({
	imports: [VideoModule],
	controllers: [ChatController],
	providers: [ChatService],
})
export class ChatModule {}
