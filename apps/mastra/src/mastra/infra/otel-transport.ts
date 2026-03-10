import { Transform } from "node:stream"
import { createCustomTransport } from "@mastra/core/logger"
import { SeverityNumber } from "@opentelemetry/api-logs"
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http"
import { resourceFromAttributes } from "@opentelemetry/resources"
import {
	BatchLogRecordProcessor,
	LoggerProvider,
} from "@opentelemetry/sdk-logs"
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions"

const PINO_TO_OTEL_SEVERITY: Record<number, SeverityNumber> = {
	10: SeverityNumber.TRACE,
	20: SeverityNumber.DEBUG,
	30: SeverityNumber.INFO,
	40: SeverityNumber.WARN,
	50: SeverityNumber.ERROR,
	60: SeverityNumber.FATAL,
}

const loggerProvider = new LoggerProvider({
	resource: resourceFromAttributes({
		[ATTR_SERVICE_NAME]: "mastra",
	}),
	processors: [
		new BatchLogRecordProcessor(
			new OTLPLogExporter({
				url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/logs`,
			}),
			{ maxQueueSize: 2048, scheduledDelayMillis: 1000 }
		),
	],
})

const otelLogger = loggerProvider.getLogger("mastra")

const stream = new Transform({
	objectMode: true,
	transform(chunk, _encoding, callback) {
		try {
			const log = JSON.parse(
				typeof chunk === "string" ? chunk : chunk.toString()
			)
			otelLogger.emit({
				severityNumber: PINO_TO_OTEL_SEVERITY[log.level] ?? SeverityNumber.INFO,
				body: log.msg,
				attributes: {
					"mastra.name": log.name ?? "mastra",
					"mastra.runId": log.runId,
				},
			})
		} catch {
			// skip unparseable lines
		}
		callback()
	},
})

export const otelTransport = createCustomTransport(stream)

process.on("SIGTERM", () => loggerProvider.shutdown())
