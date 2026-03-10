import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http"
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http"
import { resourceFromAttributes } from "@opentelemetry/resources"
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs"
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics"
import { NodeSDK } from "@opentelemetry/sdk-node"
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions"

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT

if (endpoint) {
	const sdk = new NodeSDK({
		resource: resourceFromAttributes({
			[ATTR_SERVICE_NAME]: "api",
			"deployment.environment.name": process.env.DEPLOY_ENV,
		}),
		traceExporter: new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }),
		metricReaders: [
			new PeriodicExportingMetricReader({
				exporter: new OTLPMetricExporter({ url: `${endpoint}/v1/metrics` }),
			}),
		],
		logRecordProcessors: [
			new BatchLogRecordProcessor(
				new OTLPLogExporter({ url: `${endpoint}/v1/logs` }),
				{ maxQueueSize: 2048, scheduledDelayMillis: 1000 }
			),
		],
		instrumentations: [new HttpInstrumentation()],
	})

	sdk.start()
	process.on("SIGTERM", () => sdk.shutdown())
}
