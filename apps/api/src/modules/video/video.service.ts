import {
	Inject,
	Injectable,
	InternalServerErrorException,
} from "@nestjs/common"
import { UowService } from "src/infra/database/unit-of-work.service"
import {
	type FetchCaptionsJobPayload,
	VideoJobsService,
} from "../video-jobs/video-jobs.service"
import { CreateVideoDto } from "./dto/create-video.dto"
import { CreateVideoResponseDto } from "./dto/create-video-response.dto"
import { VideoResponseDto } from "./dto/video-response.dto"
import { VideoStatusResponseDto } from "./dto/video-status-response.dto"
import { VideoRepo } from "./video.repo"

@Injectable()
export class VideoService {
	constructor(
		@Inject() private readonly uow: UowService,
		@Inject() private readonly videoRepo: VideoRepo,
		@Inject() private readonly videoJobsService: VideoJobsService
	) {}

	async create(
		createVideoDto: CreateVideoDto
	): Promise<CreateVideoResponseDto> {
		const { video, dispatchPayload } = await this.uow.run(async (uow) => {
			const video = await this.videoRepo.create(createVideoDto, uow)
			let dispatchPayload: FetchCaptionsJobPayload | null = null

			if (video.isNew) {
				dispatchPayload = { videoId: video.id, externalId: video.externalId }
				await this.videoJobsService.upsertFetchCaptionsJob(dispatchPayload, uow)
			}

			return { video, dispatchPayload }
		})

		if (dispatchPayload) {
			try {
				await this.videoJobsService.dispatchFetchCaptionsJob(dispatchPayload)
			} catch {
				await this.videoJobsService.markError(video.id)
				await this.videoRepo.updateStatus(video.id, {
					status: "error",
					statusMessage: "Queue dispatch failed",
				})
				throw new Error("Queue dispatch failed")
			}
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
	}

	async status(id: string): Promise<VideoStatusResponseDto | null> {
		const video = await this.videoRepo.findById(id)

		if (!video) {
			return null
		}

		const isFinal = ["done", "error"].includes(video.status)

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
