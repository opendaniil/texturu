import { Injectable } from "@nestjs/common"
import { UowService } from "src/infra/database/unit-of-work.service"
import { VideoRepo } from "../data/video.repo"
import { VideoArticleRepo } from "../data/video-article.repo"
import { VideoCaptionRepo } from "../data/video-caption.repo"
import { MastraService } from "./mastra.service"
import { type GenerateArticleJobData } from "./video-jobs.contract"

@Injectable()
export class GenerateArticleService {
	constructor(
		private readonly videoRepo: VideoRepo,
		private readonly videoCaptionRepo: VideoCaptionRepo,
		private readonly videoArticleRepo: VideoArticleRepo,
		private readonly mastraService: MastraService,
		private readonly uow: UowService
	) {}

	async process({ videoId }: GenerateArticleJobData) {
		await this.videoRepo.updateStatus(videoId, {
			status: "processing",
			statusMessage: "Создание статьи",
		})

		const plainText =
			await this.videoCaptionRepo.findPlainTextByVideoId(videoId)
		if (!plainText) {
			throw new Error(`No plain text found for video ${videoId}`)
		}

		const articleData = await this.mastraService.generateArticle(plainText)
		await this.uow.run(async (trx) => {
			await this.videoArticleRepo.upsertByVideoId(
				{
					videoId,
					title: articleData.title,
					article: articleData.article,
				},
				trx
			)
			await this.videoRepo.updateStatus(
				videoId,
				{
					status: "done",
					statusMessage: "Статья создана",
				},
				trx
			)
		})
	}

	async markFailed(videoId: string, message: string) {
		await this.videoRepo.updateStatus(videoId, {
			status: "error",
			statusMessage: message,
		})
	}
}
