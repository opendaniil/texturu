import { Injectable, OnModuleInit } from "@nestjs/common"
import { type Counter, type Histogram, metrics } from "@opentelemetry/api"

@Injectable()
export class MetricsService implements OnModuleInit {
	private readonly meter = metrics.getMeter("api")

	readonly jobDuration: Histogram = this.meter.createHistogram("job.duration", {
		unit: "s",
		description: "Job processing duration",
	})

	readonly jobCompleted: Counter = this.meter.createCounter("job.completed")

	readonly jobFailed: Counter = this.meter.createCounter("job.failed")

	onModuleInit() {
		// Warm up all counters so streams appear in OpenObserve immediately
		this.jobCompleted.add(0)
		this.jobFailed.add(0)
	}
}
