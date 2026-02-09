import { InjectQueue } from "@nestjs/bullmq"
import { Injectable } from "@nestjs/common"
import { Queue } from "bullmq"
import { InjectDb } from "src/infra/database/inject.decorator"
import { QUEUES } from "src/infra/queue/queue.module"
import { VideoJobRepo } from "./video-job.repo"

export type FetchCaptionsJobPayload = {
	videoId: string
	externalId: string
}

@Injectable()
export class VideoJobsService {
	constructor(
		private readonly videoJobRepo: VideoJobRepo,
		@InjectQueue(QUEUES.VIDEO_JOB) private readonly queue: Queue,
		@InjectDb() private readonly db: InjectDb.Client
	) {}

	async upsertFetchCaptionsJob(
		payload: FetchCaptionsJobPayload,
		executor: InjectDb.Client = this.db
	) {
		await this.videoJobRepo.enqueue(payload.videoId, payload, executor)
	}

	async dispatchFetchCaptionsJob(payload: FetchCaptionsJobPayload) {
		await this.queue.add("fetching_captions", payload, {
			jobId: payload.videoId,
			removeOnComplete: 1000,
			removeOnFail: 1000,
			attempts: 1,
		})
	}

	async markRunning(videoId: string) {
		await this.videoJobRepo.updateActive(videoId, {
			state: "running",
			startedAt: new Date(),
			finishedAt: null,
		})
	}

	async markDone(videoId: string) {
		await this.videoJobRepo.updateActive(videoId, {
			state: "done",
			finishedAt: new Date(),
		})
	}

	async markError(videoId: string) {
		await this.videoJobRepo.updateActive(videoId, {
			state: "error",
			finishedAt: new Date(),
		})
	}
}
