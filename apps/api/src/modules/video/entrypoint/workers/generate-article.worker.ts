import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq"
import { Injectable, Logger } from "@nestjs/common"
import { Job } from "bullmq"
import { MetricsService } from "src/infra/otel/metrics.service"
import { GenerateArticleService } from "../../application/generate-article.service"
import {
	type GenerateArticleJobData,
	QUEUES,
} from "../../application/video-jobs.contract"

type ProcessPayload = GenerateArticleJobData

@Processor(QUEUES.GENERATE_ARTICLE, { concurrency: 1 })
@Injectable()
export class GenerateArticleWorker extends WorkerHost {
	private logger = new Logger(GenerateArticleWorker.name)

	constructor(
		private readonly videoWorkflowService: GenerateArticleService,
		private readonly metrics: MetricsService
	) {
		super()
	}

	async process(job: Job<ProcessPayload>) {
		this.logger.log(`Start jobId=${job.id} attempt=${job.attemptsMade + 1}`)
		const start = performance.now()
		try {
			await this.videoWorkflowService.process(job.data)
			const durationS = (performance.now() - start) / 1000
			this.metrics.jobDuration.record(durationS, {
				queue: QUEUES.GENERATE_ARTICLE,
			})
			this.metrics.jobCompleted.add(1, { queue: QUEUES.GENERATE_ARTICLE })
		} catch (error) {
			this.logger.error(
				`Failed jobId=${job.id} attempt=${job.attemptsMade + 1}`,
				error instanceof Error ? error.stack : undefined
			)
			throw error
		}
	}

	@OnWorkerEvent("failed")
	async onFailed(job: Job<ProcessPayload> | undefined, error: Error) {
		if (!job) {
			this.logger.warn(
				"Failed event without job (likely removed by removeOnFail)"
			)
			return
		}

		const isFinalAttempt =
			job.attemptsMade >= Math.max(1, job.opts.attempts ?? 1)
		if (!isFinalAttempt) {
			return
		}

		this.metrics.jobFailed.add(1, { queue: QUEUES.GENERATE_ARTICLE })

		const message = (error?.message ?? "Unknown error").trim()
		this.logger.error(
			`Final failure jobId=${job.id} attempts=${job.attemptsMade}`,
			error.stack
		)
		try {
			await this.videoWorkflowService.markFailed(job.data.videoId, message)
		} catch (updateError) {
			this.logger.error(
				`Failed to update video status for jobId=${job.id}`,
				updateError instanceof Error ? updateError.stack : undefined
			)
		}
	}

	@OnWorkerEvent("error")
	onWorkerError(error: Error) {
		this.logger.error(
			"Worker error",
			error instanceof Error ? error.stack : undefined
		)
	}

	@OnWorkerEvent("stalled")
	onStalled(jobId: string, prev: string) {
		this.logger.warn(`Stalled jobId=${jobId} prev=${prev}`)
	}
}
