import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common"
import { Catch, Logger } from "@nestjs/common"
import type { Response } from "express"
import { DomainError } from "../errors/domain.error"

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(DomainExceptionFilter.name)

	catch(exception: DomainError, host: ArgumentsHost) {
		const ctx = host.switchToHttp()
		const response = ctx.getResponse<Response>()

		this.logger.error(exception.message, exception.stack)

		response.status(exception.statusCode).json({
			statusCode: exception.statusCode,
			message: exception.message,
		})
	}
}
