import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq"
import { Injectable, Logger } from "@nestjs/common"
import { Job } from "bullmq"
import { UowService } from "src/infra/database/unit-of-work.service"
import { QUEUES } from "src/infra/queue/queue.module"
import { VideoRepo } from "../video/video.repo"
import { VideoArticleRepo } from "../video/video-article.repo"
import { VideoCaptionRepo } from "../video/video-caption.repo"
import { MastraService } from "./mastra.service"
import { GenerateArticleJobData } from "./video-jobs.service"

type ProcessPayload = GenerateArticleJobData

@Processor(QUEUES.GENERATE_ARTICLE)
@Injectable()
export class GenerateArticleWorker extends WorkerHost {
	private logger = new Logger(GenerateArticleWorker.name)

	constructor(
		private readonly mastraService: MastraService,
		private readonly videoRepo: VideoRepo,
		private readonly videoArticleRepo: VideoArticleRepo,
		private readonly videoCaptionRepo: VideoCaptionRepo,
		private readonly uow: UowService
	) {
		super()
	}

	async process(job: Job<ProcessPayload>) {
		const { videoId } = job.data

		try {
			this.logger.log(`Start jobId=${job.id} attempt=${job.attemptsMade + 1}`)
			await this.videoRepo.updateStatus(videoId, {
				status: "processing",
				statusMessage: "generating article",
			})

			const plainText =
				await this.videoCaptionRepo.findPlainTextByVideoId(videoId)
			if (!plainText) {
				throw new Error(`No plain text found for video ${videoId}`)
			}

			const articleData = await this.mastraService.generateArticle(plainText)
			await this.uow.run(async (trx) => {
				await this.videoArticleRepo.upsertByVideoId(
					{
						videoId,
						title: articleData.title,
						article: articleData.article,
					},
					trx
				)
				await this.videoRepo.updateStatus(
					videoId,
					{
						status: "done",
						statusMessage: "article generated",
					},
					trx
				)
			})
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

		const message = (error?.message ?? "Unknown error").trim()
		this.logger.error(
			`Final failure jobId=${job.id} attempts=${job.attemptsMade}`,
			error.stack
		)
		try {
			await this.videoRepo.updateStatus(job.data.videoId, {
				status: "error",
				statusMessage: message,
			})
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
