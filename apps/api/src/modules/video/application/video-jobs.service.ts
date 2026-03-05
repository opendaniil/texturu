import { InjectQueue } from "@nestjs/bullmq"
import { Injectable } from "@nestjs/common"
import { Queue } from "bullmq"
import { QueueUnavailableError } from "./video.errors"
import {
	type FetchCaptionsJobData,
	type FetchInfoJobData,
	type GenerateArticleJobData,
	QUEUES,
} from "./video-jobs.contract"

const DEFAULT_JOB_OPTIONS = {
	attempts: 3,
	backoff: {
		type: "exponential" as const,
		delay: 5000,
	},
	removeOnComplete: 10,
	removeOnFail: 100,
}

@Injectable()
export class VideoJobsService {
	constructor(
		@InjectQueue(QUEUES.FETCHING_INFO) private readonly fetchInfoQueue: Queue,
		@InjectQueue(QUEUES.FETCHING_CAPTIONS) private readonly fetchQueue: Queue,
		@InjectQueue(QUEUES.GENERATE_ARTICLE) private readonly generateQueue: Queue
	) {}

	async enqueueFetchInfo(payload: FetchInfoJobData) {
		await this.enqueue(
			this.fetchInfoQueue,
			QUEUES.FETCHING_INFO,
			payload,
			this.toJobId(QUEUES.FETCHING_INFO, payload.videoId)
		)
	}

	async enqueueFetchCaptions(payload: FetchCaptionsJobData) {
		await this.enqueue(
			this.fetchQueue,
			QUEUES.FETCHING_CAPTIONS,
			payload,
			this.toJobId(QUEUES.FETCHING_CAPTIONS, payload.videoId)
		)
	}

	async enqueueGenerateArticle(payload: GenerateArticleJobData) {
		await this.enqueue(
			this.generateQueue,
			QUEUES.GENERATE_ARTICLE,
			payload,
			this.toJobId(QUEUES.GENERATE_ARTICLE, payload.videoId),
			{ attempts: 1 }
		)
	}

	private async enqueue<TData extends { videoId: string }>(
		queue: Queue,
		name: string,
		payload: TData,
		jobId: string,
		overrides?: Partial<typeof DEFAULT_JOB_OPTIONS>
	) {
		try {
			await queue.add(name, payload, {
				...DEFAULT_JOB_OPTIONS,
				...overrides,
				jobId,
			})
		} catch (error) {
			throw new QueueUnavailableError(error)
		}
	}

	private toJobId(queue: string, videoId: string): string {
		return `${queue}-${videoId}`
	}
}
