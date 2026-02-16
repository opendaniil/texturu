import {
	Inject,
	Injectable,
	Logger,
	ServiceUnavailableException,
} from "@nestjs/common"
import { UowService } from "src/infra/database/unit-of-work.service"
import { VideoRepo } from "../data/video.repo"
import { VideoArticleRepo } from "../data/video-article.repo"
import { VideoInfoRepo } from "../data/video-info.repo"
import { type CreateVideoDto } from "../entrypoint/rest/dto/create-video.dto"
import { type CreateVideoResponseDto } from "../entrypoint/rest/dto/create-video-response.dto"
import { type VideoArticleResponseDto } from "../entrypoint/rest/dto/video-article-response.dto"
import { type VideoResponseDto } from "../entrypoint/rest/dto/video-response.dto"
import { type VideoStatusResponseDto } from "../entrypoint/rest/dto/video-status-response.dto"
import { VideoJobEnqueueError, VideoJobsService } from "./video-jobs.service"

@Injectable()
export class VideoService {
	private readonly logger = new Logger(VideoService.name)

	constructor(
		@Inject() private readonly uow: UowService,
		@Inject() private readonly videoRepo: VideoRepo,
		@Inject() private readonly videoInfoRepo: VideoInfoRepo,
		@Inject() private readonly videoArticleRepo: VideoArticleRepo,
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
					await this.videoJobsService.enqueueFetchInfo({
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
				statusMessage: video.statusMessage,
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

		const info = await this.videoInfoRepo.findByVideoId(id)

		return {
			...video,
			info,
		}
	}

	async getArticle(videoId: string): Promise<VideoArticleResponseDto | null> {
		const article = await this.videoArticleRepo.findByVideoId(videoId)
		if (!article) {
			return null
		}

		return article
	}
}
