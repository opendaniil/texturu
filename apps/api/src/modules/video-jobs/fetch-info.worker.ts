import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq"
import { Injectable, Logger } from "@nestjs/common"
import { Job } from "bullmq"
import { AppConfigService } from "src/infra/app-config/app-config.service"
import { QUEUES } from "src/infra/queue/queue.module"

import { VideoInfo, YtDlp } from "ytdlp-nodejs"
import { VideoRepo } from "../video/video.repo"
import { FetchCaptionsJobData, VideoJobsService } from "./video-jobs.service"

type ProcessPayload = FetchCaptionsJobData

@Processor(QUEUES.FETCHING_INFO, { concurrency: 1 })
@Injectable()
export class FetchInfoWorker extends WorkerHost {
	private logger = new Logger(FetchInfoWorker.name)
	private readonly ytdlp: YtDlp

	constructor(
		private readonly videoJobsService: VideoJobsService,
		private readonly videoRepo: VideoRepo,
		private readonly appConfig: AppConfigService
	) {
		super()
		this.ytdlp = new YtDlp({
			binaryPath: "/usr/bin/yt-dlp",
		})
	}

	async process(job: Job<ProcessPayload>) {
		const { videoId, externalId } = job.data

		try {
			this.logger.log(`Start jobId=${job.id} attempt=${job.attemptsMade + 1}`)
			await this.videoRepo.updateStatus(videoId, {
				status: "processing",
				statusMessage: "Получение информации о видео",
			})

			await this.fetchAndSaveInfo(videoId, externalId)

			// Next step
			await this.videoJobsService.enqueueFetchCaptions({ videoId, externalId })
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
			`Worker error`,
			error instanceof Error ? error.stack : undefined
		)
	}

	@OnWorkerEvent("stalled")
	onStalled(jobId: string, prev: string) {
		this.logger.warn(`Stalled jobId=${jobId} prev=${prev}`)
	}

	private async fetchAndSaveInfo(videoId: string, youtubeId: string) {
		const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`
		const proxy = this.appConfig.get("YOUTUBE_PROXY")

		try {
			const info = await this.ytdlp.getInfoAsync(youtubeUrl, {
				// @ts-expect-error @types/ytdlp-nodejs не содержит rawArgs, но работает
				rawArgs: ["--proxy", proxy],
			})

			const {
				fulltitle,
				description,
				channel_id,
				channel: channelTitle,
				duration,
				categories,
				tags,
				language,
			} = info as VideoInfo

			const result = {
				fulltitle,
				description,
				channelId: channel_id,
				channelTitle,
				duration,
				categories,
				tags,
				language,
			}

			console.log(">", JSON.stringify({ result }, null, 2))
		} catch (error) {
			throw error
		}
	}
}
