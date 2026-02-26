import {
	BadGatewayException,
	Body,
	Controller,
	Get,
	Post,
	Query,
	Req,
	Res,
} from "@nestjs/common"
import { ApiOkResponse } from "@nestjs/swagger"
import { pipeUIMessageStreamToResponse } from "ai"
import type { Request, Response } from "express"
import { createUuidV7, isUuidV7 } from "src/common/id/uuidv7"
import { AppConfigService } from "src/infra/app-config/app-config.service"
import { ChatService } from "../../application/chat.service"
import { ChatHistoryQueryDto } from "./dto/chat-history-query.dto"
import { ChatHistoryResponseDto } from "./dto/chat-history-response.dto"
import { ChatRequestDto } from "./dto/chat-request.dto"

type RequestWithCookies = Request & {
	cookies?: Record<string, unknown>
}

@Controller("chat")
export class ChatController {
	constructor(
		private readonly chatService: ChatService,
		private readonly config: AppConfigService
	) {}

	@Get("history")
	@ApiOkResponse({ type: ChatHistoryResponseDto })
	async history(
		@Query() dto: ChatHistoryQueryDto,
		@Req() req: RequestWithCookies,
		@Res({ passthrough: true }) res: Response
	) {
		const anonId = this.resolveAnonId(req, res)

		try {
			return await this.chatService.getHistory({
				...dto,
				anonId,
			})
		} catch {
			throw new BadGatewayException("Failed to load chat history from agent")
		}
	}

	@Post("stream")
	async stream(
		@Body() dto: ChatRequestDto,
		@Req() req: RequestWithCookies,
		@Res() res: Response
	): Promise<void> {
		const anonId = this.resolveAnonId(req, res)

		try {
			const stream = await this.chatService.streamResponse({
				...dto,
				anonId,
			})

			pipeUIMessageStreamToResponse({
				response: res,
				stream,
			})
		} catch {
			throw new BadGatewayException("Failed to stream response from agent")
		}
	}

	private resolveAnonId(req: RequestWithCookies, res: Response): string {
		const CHAT_ANON_COOKIE_NAME = "anon_id"
		const CHAT_ANON_COOKIE_MAX_AGE_MS = 1_000 * 60 * 60 * 24 * 365 // one year

		const cookieValue = req.cookies?.[CHAT_ANON_COOKIE_NAME]
		if (typeof cookieValue === "string") {
			const candidate = cookieValue.trim()
			if (candidate.length > 0 && isUuidV7(candidate)) {
				return candidate
			}
		}

		const anonId = createUuidV7()

		res.cookie(CHAT_ANON_COOKIE_NAME, anonId, {
			httpOnly: true,
			sameSite: "lax",
			secure: this.config.isProd,
			path: "/",
			maxAge: CHAT_ANON_COOKIE_MAX_AGE_MS,
		})

		return anonId
	}
}
