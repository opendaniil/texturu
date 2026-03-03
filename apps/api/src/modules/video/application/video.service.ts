import { Inject, Injectable, Logger } from "@nestjs/common"
import type {
	LatestVideoArticlesQuery,
	ListVideosQuery,
} from "@tubebook/schemas"
import { CacheService } from "src/infra/cache/cache.service"
import { UowService } from "src/infra/database/unit-of-work.service"
import { VideoRepo } from "../data/video.repo"
import { VideoArticleRepo } from "../data/video-article.repo"
import { VideoInfoRepo } from "../data/video-info.repo"
import type { CreateVideoDto } from "../entrypoint/rest/dto/create-video.dto"
import { VideoJobsService } from "./video-jobs.service"

@Injectable()
export class VideoService {
	private readonly logger = new Logger(VideoService.name)

	constructor(
		@Inject() private readonly uow: UowService,
		@Inject() private readonly videoRepo: VideoRepo,
		@Inject() private readonly videoInfoRepo: VideoInfoRepo,
		@Inject() private readonly videoArticleRepo: VideoArticleRepo,
		@Inject() private readonly videoJobsService: VideoJobsService,
		@Inject() private readonly cacheService: CacheService
	) {}

	async create(createVideoDto: CreateVideoDto) {
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
	}

	async status(videoId: string) {
		const video = await this.videoRepo.findById(videoId)

		if (!video) {
			return null
		}

		const { id, source, externalId, status, statusMessage, updatedAt } = video

		const isFinal = ["done", "error"].includes(status)
		const articleSlug =
			status === "done"
				? ((await this.videoArticleRepo.findByVideoId(videoId))?.slug ?? null)
				: null

		return {
			id,
			source,
			externalId,
			status,
			statusMessage,
			isFinal,
			updatedAt,
			articleSlug,
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

	async getArticleBySlug(slug: string) {
		const article = await this.videoArticleRepo.findBySlug(slug)

		if (!article) {
			return null
		}

		const [info, video] = await Promise.all([
			this.videoInfoRepo.findByVideoId(article.videoId),
			this.videoRepo.findById(article.videoId),
		])

		if (!info || !video) {
			return null
		}

		return {
			...article,

			info,

			source: video.source,
			externalId: video.externalId,
		}
	}

	async latestArticles(query: LatestVideoArticlesQuery) {
		const items = await this.cacheService.getOrSet(
			`latest-articles:${query.limit}`,
			() => this.videoArticleRepo.findLatest(query.limit),
			60_000
		)

		return { items }
	}
}
