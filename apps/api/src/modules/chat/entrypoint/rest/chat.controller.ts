import {
	BadGatewayException,
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	Req,
	Res,
} from "@nestjs/common"
import { ApiOkResponse } from "@nestjs/swagger"
import type { Request, Response } from "express"
import { createUuidV7, isUuidV7 } from "src/common/id/uuidv7"
import { AppConfigService } from "src/infra/app-config/app-config.service"
import { ChatService } from "../../application/chat.service"
import { ChatRequestDto } from "./dto/chat-request.dto"
import { ChatResponseDto } from "./dto/chat-response.dto"

type RequestWithCookies = Request & {
	cookies?: Record<string, unknown>
}

@Controller("chat")
export class ChatController {
	constructor(
		private readonly chatService: ChatService,
		private readonly config: AppConfigService
	) {}

	@Post()
	@HttpCode(HttpStatus.OK)
	@ApiOkResponse({ type: ChatResponseDto })
	reply(
		@Body() dto: ChatRequestDto,
		@Req() req: RequestWithCookies,
		@Res({ passthrough: true }) res: Response
	) {
		const anonId = this.resolveAnonId(req, res)

		try {
			return this.chatService.generateResponse({
				...dto,
				anonId,
			})
		} catch {
			throw new BadGatewayException("Failed to get response from articleAgent")
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
