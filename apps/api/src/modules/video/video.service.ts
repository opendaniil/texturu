import {
	Inject,
	Injectable,
	Logger,
	ServiceUnavailableException,
} from "@nestjs/common"
import { UowService } from "src/infra/database/unit-of-work.service"
import {
	VideoJobEnqueueError,
	VideoJobsService,
} from "../video-jobs/video-jobs.service"
import { CreateVideoDto } from "./dto/create-video.dto"
import { CreateVideoResponseDto } from "./dto/create-video-response.dto"
import { VideoResponseDto } from "./dto/video-response.dto"
import { VideoStatusResponseDto } from "./dto/video-status-response.dto"
import { VideoRepo } from "./video.repo"

@Injectable()
export class VideoService {
	private readonly logger = new Logger(VideoService.name)

	constructor(
		@Inject() private readonly uow: UowService,
		@Inject() private readonly videoRepo: VideoRepo,
		@Inject() private readonly videoJobsService: VideoJobsService
	) {}

	async create(
		createVideoDto: CreateVideoDto
	): Promise<CreateVideoResponseDto> {
		try {
			const video = await this.uow.run(async (uow) => {
				const created = await this.videoRepo.createOrGetByExternalId(
					createVideoDto,
					uow
				)

				if (created.isNew) {
					await this.videoJobsService.enqueueFetchCaptions({
						videoId: created.id,
						externalId: created.externalId,
					})
				}

				return created
			})

			return {
				id: video.id,
				isNew: video.isNew,
				source: video.source,
				externalId: video.externalId,
				redirectTo: `${video.id}`,
				status: video.status,
				statusMessage: "",
			}
		} catch (error) {
			this.logger.error("Failed to create video", error)
			if (error instanceof VideoJobEnqueueError) {
				throw new ServiceUnavailableException(
					"Queue is temporarily unavailable, please retry later."
				)
			}
			throw error
		}
	}

	async status(videoId: string): Promise<VideoStatusResponseDto | null> {
		const video = await this.videoRepo.findById(videoId)

		if (!video) {
			return null
		}

		const { id, source, externalId, status, statusMessage, updatedAt } = video

		const isFinal = ["done", "error"].includes(status)

		return {
			id,
			source,
			externalId,
			status,
			statusMessage,
			isFinal,
			updatedAt,
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
