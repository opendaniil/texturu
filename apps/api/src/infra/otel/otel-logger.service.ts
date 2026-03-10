import { LoggerService } from "@nestjs/common"
import { logs, SeverityNumber } from "@opentelemetry/api-logs"

export class OtelLoggerService implements LoggerService {
	private readonly otelLogger

	constructor() {
		this.otelLogger = logs.getLoggerProvider().getLogger("nestjs")
	}

	log(message: string, ...optionalParams: unknown[]) {
		const context = optionalParams[optionalParams.length - 1]
		console.log(`[${context ?? "App"}]`, message)
		this.emit(SeverityNumber.INFO, message, context)
	}

	error(message: string, ...optionalParams: unknown[]) {
		const context = optionalParams[optionalParams.length - 1]
		const stack = optionalParams.length >= 2 ? optionalParams[0] : undefined
		console.error(`[${context ?? "App"}]`, message, stack ?? "")
		this.emit(SeverityNumber.ERROR, message, context, { stack })
	}

	warn(message: string, ...optionalParams: unknown[]) {
		const context = optionalParams[optionalParams.length - 1]
		console.warn(`[${context ?? "App"}]`, message)
		this.emit(SeverityNumber.WARN, message, context)
	}

	debug(message: string, ...optionalParams: unknown[]) {
		const context = optionalParams[optionalParams.length - 1]
		console.debug(`[${context ?? "App"}]`, message)
		this.emit(SeverityNumber.DEBUG, message, context)
	}

	verbose(message: string, ...optionalParams: unknown[]) {
		const context = optionalParams[optionalParams.length - 1]
		console.debug(`[${context ?? "App"}]`, message)
		this.emit(SeverityNumber.TRACE, message, context)
	}

	private emit(
		severityNumber: SeverityNumber,
		message: string,
		context: unknown,
		extra?: Record<string, unknown>
	) {
		this.otelLogger.emit({
			severityNumber,
			body: message,
			attributes: {
				"nestjs.context": typeof context === "string" ? context : "App",
				...extra,
			},
		})
	}
}
