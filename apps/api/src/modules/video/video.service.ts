import { InjectQueue } from "@nestjs/bullmq"
import { Inject, Injectable } from "@nestjs/common"
import { Queue } from "bullmq"
import { UowService } from "src/infra/database/unit-of-work.service"
import { QUEUES } from "src/infra/queue/queue.module"
import { CreateVideoDto } from "./dto/create-video.dto"
import { CreateVideoResponseDto } from "./dto/create-video-response.dto"
import { VideoResponseDto } from "./dto/video-response.dto"
import { VideoStatusResponseDto } from "./dto/video-status-response.dto"
import { VideoRepo } from "./video.repo"
import { VideoJobRepo } from "./video-job.repo"

@Injectable()
export class VideoService {
	constructor(
		@Inject() private readonly uow: UowService,
		@Inject() private readonly videoRepo: VideoRepo,
		@Inject() private readonly videoJobRepo: VideoJobRepo,
		@InjectQueue(QUEUES.VIDEO_JOB) private readonly videoQueue: Queue
	) {}

	async create(
		createVideoDto: CreateVideoDto
	): Promise<CreateVideoResponseDto> {
		return this.uow.run(async (uow) => {
			const video = await this.videoRepo.create(createVideoDto, uow)

			if (video.isNew) {
				await this.videoJobRepo.enqueue(video.id, uow)

				await this.videoQueue.add(
					"process",
					{ videoId: video.id },
					{
						jobId: video.id,
						removeOnComplete: 1000,
						removeOnFail: 1000,
						attempts: 1,
					}
				)
			}

			return {
				id: video.id,
				isNew: video.isNew,
				source: video.source,
				externalId: video.externalId,
				redirectTo: `${video.id}`,
				status: video.status,
				statusMessage: "",
			}
		})
	}

	async status(id: string): Promise<VideoStatusResponseDto | null> {
		const video = await this.videoRepo.findById(id)

		if (!video) {
			return null
		}

		const isFinal = ["done", "error", "no_captions"].includes(video.status)

		return {
			id: video.id,

			source: video.source,
			externalId: video.externalId,

			status: video.status,
			statusMessage: video.statusMessage,

			isFinal,
			updatedAt: video.updatedAt,
		}
	}

	async findOne(id: string): Promise<VideoResponseDto | null> {
		const video = await this.videoRepo.findById(id)

		if (!video) {
			return null
		}

		return video
	}
}
