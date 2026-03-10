import { ExecutionContext, createParamDecorator } from "@nestjs/common"

export const AnonId = createParamDecorator(
	(_data: unknown, ctx: ExecutionContext): string =>
		ctx.switchToHttp().getRequest().anonId
)
