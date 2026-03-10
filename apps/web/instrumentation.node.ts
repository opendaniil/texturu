import { SeverityNumber } from "@opentelemetry/api-logs"
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http"
import { resourceFromAttributes } from "@opentelemetry/resources"
import {
	BatchLogRecordProcessor,
	LoggerProvider,
} from "@opentelemetry/sdk-logs"
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions"

const loggerProvider = new LoggerProvider({
	resource: resourceFromAttributes({
		[ATTR_SERVICE_NAME]: "web",
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

export const logger = loggerProvider.getLogger("nextjs")

export function register() {
	logger.emit({
		severityNumber: SeverityNumber.INFO,
		body: "Next.js server started",
	})
}

process.on("SIGTERM", () => loggerProvider.shutdown())
