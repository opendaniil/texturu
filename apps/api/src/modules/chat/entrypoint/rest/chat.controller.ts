import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common"
import { ApiOkResponse } from "@nestjs/swagger"
import { ChatService } from "../../application/chat.service"
import { ChatRequestDto } from "./dto/chat-request.dto"
import { ChatResponseDto } from "./dto/chat-response.dto"

@Controller("chat")
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	@Post()
	@HttpCode(HttpStatus.OK)
	@ApiOkResponse({ type: ChatResponseDto })
	reply(@Body() dto: ChatRequestDto) {
		return this.chatService.reply(dto)
	}
}
