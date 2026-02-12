import { InjectQueue } from "@nestjs/bullmq"
import { Injectable } from "@nestjs/common"
import { Queue } from "bullmq"
import { QUEUES } from "src/infra/queue/queue.module"

export type FetchCaptionsJobData = {
	videoId: string
	externalId: string
}

export type GenerateArticleJobData = {
	videoId: string
}

export class VideoJobEnqueueError extends Error {
	constructor(message: string, cause?: unknown) {
		super(message, { cause })
		this.name = "VideoJobEnqueueError"
	}
}

const DEFAULT_JOB_OPTIONS = {
	attempts: 3,
	backoff: {
		type: "exponential" as const,
		delay: 5000,
	},
	removeOnComplete: 1000,
	removeOnFail: 1000,
}

@Injectable()
export class VideoJobsService {
	constructor(
		@InjectQueue(QUEUES.FETCHING_CAPTIONS) private readonly fetchQueue: Queue,
		@InjectQueue(QUEUES.GENERATE_ARTICLE) private readonly generateQueue: Queue
	) {}

	async enqueueFetchCaptions(payload: FetchCaptionsJobData) {
		await this.enqueue(
			this.fetchQueue,
			QUEUES.FETCHING_CAPTIONS,
			payload,
			this.toFetchJobId(payload.videoId),
			payload.videoId
		)
	}

	async enqueueGenerateArticle(payload: GenerateArticleJobData) {
		await this.enqueue(
			this.generateQueue,
			QUEUES.GENERATE_ARTICLE,
			payload,
			this.toGenerateJobId(payload.videoId),
			payload.videoId
		)
	}

	private async enqueue<TData extends { videoId: string }>(
		queue: Queue,
		name: string,
		payload: TData,
		jobId: string,
		videoId: string
	) {
		try {
			await queue.add(name, payload, {
				...DEFAULT_JOB_OPTIONS,
				jobId,
			})
		} catch (error) {
			throw new VideoJobEnqueueError(
				`Failed to enqueue ${name} for video ${videoId}`,
				error
			)
		}
	}

	private toFetchJobId(videoId: string): string {
		return `${QUEUES.FETCHING_CAPTIONS}-${videoId}`
	}

	private toGenerateJobId(videoId: string): string {
		return `${QUEUES.GENERATE_ARTICLE}-${videoId}`
	}
}
