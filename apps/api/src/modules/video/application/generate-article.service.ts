import { randomBytes } from "node:crypto"
import { Injectable } from "@nestjs/common"
import slugify from "@sindresorhus/slugify"
import { format } from "date-fns"
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

		const articleData = await this.mastraService.generateArticle(
			videoId,
			plainText
		)
		await this.uow.run(async (trx) => {
			await this.videoArticleRepo.create(
				{
					videoId,
					title: articleData.title,
					description: articleData.description,
					article: articleData.article,
					slug: this.createSlug(articleData.title),
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

	private createSlug(title: string): string {
		let titleSlug = slugify(title, {
			separator: "-",
			lowercase: true,
			decamelize: true,
			transliterate: true,
			locale: "ru",
		})

		const maxLen = 256
		if (titleSlug.length > maxLen) {
			const cut = titleSlug
				.split("-")
				.filter(Boolean)
				.reduce((acc, word) => {
					const candidate = acc ? `${acc}-${word}` : word
					return candidate.length <= maxLen ? candidate : acc
				}, "")

			titleSlug = cut || titleSlug.slice(0, maxLen)
		}

		const datePart = format(new Date(), "yyyyMMdd")
		const randomPart = randomBytes(3).toString("hex")

		return `${randomPart}-${titleSlug}-${datePart}`
	}

	async markFailed(videoId: string, message: string) {
		await this.videoRepo.updateStatus(videoId, {
			status: "error",
			statusMessage: message,
		})
	}
}
