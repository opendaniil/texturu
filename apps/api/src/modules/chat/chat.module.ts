import { Module } from "@nestjs/common"
import { ChatService } from "./application/chat.service"
import { ChatController } from "./entrypoint/rest/chat.controller"

@Module({
	controllers: [ChatController],
	providers: [ChatService],
})
export class ChatModule {}
