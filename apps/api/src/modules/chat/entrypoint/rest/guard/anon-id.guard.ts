import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common"
import type { Request, Response } from "express"
import { createUuidV7, isUuidV7 } from "src/common/id/uuidv7"
import { AppConfigService } from "src/infra/app-config/app-config.service"

const ANON_ID_COOKIE = "anon_id"
const ANON_ID_MAX_AGE_MS = 1_000 * 60 * 60 * 24 * 365

@Injectable()
export class AnonIdGuard implements CanActivate {
	constructor(private readonly config: AppConfigService) {}

	canActivate(context: ExecutionContext): boolean {
		const req = context.switchToHttp().getRequest<Request>()
		const res = context.switchToHttp().getResponse<Response>()

		const cookie = req.cookies?.[ANON_ID_COOKIE]
		if (typeof cookie === "string" && isUuidV7(cookie.trim())) {
			;(req as any).anonId = cookie.trim()
			return true
		}

		const anonId = createUuidV7()

		res.cookie(ANON_ID_COOKIE, anonId, {
			httpOnly: true,
			sameSite: "lax",
			secure: this.config.isProd,
			path: "/",
			maxAge: ANON_ID_MAX_AGE_MS,
		})

		;(req as any).anonId = anonId
		return true
	}
}
