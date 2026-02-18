import {
	Inject,
	Injectable,
	Logger,
	ServiceUnavailableException,
} from "@nestjs/common"
import type { ListVideosQuery } from "@tubebook/schemas"
import { UowService } from "src/infra/database/unit-of-work.service"
import { VideoRepo } from "../data/video.repo"
import { VideoArticleRepo } from "../data/video-article.repo"
import { VideoInfoRepo } from "../data/video-info.repo"
import type { CreateVideoDto } from "../entrypoint/rest/dto/create-video.dto"
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

	async create(createVideoDto: CreateVideoDto) {
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

	async status(videoId: string) {
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

	async list(query: ListVideosQuery) {
		const { items: videos, rowCount } = await this.videoRepo.findPage(query)

		if (videos.length === 0) {
			return {
				items: [],
				rowCount,
			}
		}

		const videoIds = videos.map((video) => video.id)
		const infos = await this.videoInfoRepo.findByVideoIds(videoIds)

		const infoByVideoId = new Map(infos.map((info) => [info.videoId, info]))

		const videosWithInfo = videos.map((video) => ({
			...video,
			info: infoByVideoId.get(video.id) ?? null,
		}))

		return {
			items: videosWithInfo,
			rowCount,
		}
	}

	async findOne(id: string) {
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

	async getArticle(videoId: string) {
		const [article, info, video] = await Promise.all([
			this.videoArticleRepo.findByVideoId(videoId),
			this.videoInfoRepo.findByVideoId(videoId),
			this.videoRepo.findById(videoId),
		])

		if (!article || !info || !video) {
			return null
		}

		return {
			...article,

			info,

			source: video.source,
			externalId: video.externalId,
		}
	}
}
