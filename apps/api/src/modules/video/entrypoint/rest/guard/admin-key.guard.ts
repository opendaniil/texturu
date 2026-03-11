import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
} from "@nestjs/common"
import type { Request } from "express"
import { AppConfigService } from "src/infra/app-config/app-config.service"

@Injectable()
export class AdminKeyGuard implements CanActivate {
	constructor(private readonly config: AppConfigService) {}

	canActivate(context: ExecutionContext): boolean {
		const req = context.switchToHttp().getRequest<Request>()
		const key = req.headers["x-admin-key"]

		if (key !== this.config.get("ADMIN_SECRET_KEY")) {
			throw new ForbiddenException()
		}

		return true
	}
}
