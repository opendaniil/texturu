import {
	BadGatewayException,
	Body,
	Controller,
	Get,
	Post,
	Query,
	Res,
	UseGuards,
} from "@nestjs/common"
import { ApiOkResponse } from "@nestjs/swagger"
import { pipeUIMessageStreamToResponse } from "ai"
import type { Response } from "express"
import { ChatService } from "../../application/chat.service"
import { AnonId } from "./decorator/anon-id.decorator"
import { ChatHistoryQueryDto } from "./dto/chat-history-query.dto"
import { ChatHistoryResponseDto } from "./dto/chat-history-response.dto"
import { ChatRequestDto } from "./dto/chat-request.dto"
import { AnonIdGuard } from "./guard/anon-id.guard"

@Controller("chat")
@UseGuards(AnonIdGuard)
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	@Get("history")
	@ApiOkResponse({ type: ChatHistoryResponseDto })
	async history(@Query() dto: ChatHistoryQueryDto, @AnonId() anonId: string) {
		try {
			return await this.chatService.getHistory({ ...dto, anonId })
		} catch {
			throw new BadGatewayException("Failed to load chat history from agent")
		}
	}

	@Post("stream")
	async stream(
		@Body() dto: ChatRequestDto,
		@AnonId() anonId: string,
		@Res() res: Response
	): Promise<void> {
		try {
			const stream = await this.chatService.streamResponse({
				...dto,
				anonId,
			})

			pipeUIMessageStreamToResponse({ response: res, stream })
		} catch {
			throw new BadGatewayException("Failed to stream response from agent")
		}
	}
}
