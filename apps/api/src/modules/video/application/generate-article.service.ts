import { randomBytes } from "node:crypto"
import { Injectable } from "@nestjs/common"
import slugify from "@sindresorhus/slugify"
import { VideoArticle } from "@texturu/schemas"
import { format } from "date-fns"
import { UowService } from "src/infra/database/unit-of-work.service"
import { RevalidationService } from "src/infra/revalidation/revalidation.service"
import { VideoRepo } from "../data/video.repo"
import { VideoArticleRepo } from "../data/video-article.repo"
import { VideoCaptionRepo } from "../data/video-caption.repo"
import { MastraService } from "./mastra.service"
import { PlainTextNotFoundError } from "./video.errors"
import { type GenerateArticleJobData } from "./video-jobs.contract"

@Injectable()
export class GenerateArticleService {
	constructor(
		private readonly videoRepo: VideoRepo,
		private readonly videoCaptionRepo: VideoCaptionRepo,
		private readonly videoArticleRepo: VideoArticleRepo,
		private readonly mastraService: MastraService,
		private readonly uow: UowService,
		private readonly revalidationService: RevalidationService
	) {}

	async process({ videoId }: GenerateArticleJobData) {
		await this.videoRepo.updateStatus(videoId, {
			status: "generating_article",
			statusMessage: "Создание статьи",
		})

		const plainText =
			await this.videoCaptionRepo.findPlainTextByVideoId(videoId)
		if (!plainText) {
			throw new PlainTextNotFoundError(videoId)
		}

		const articleData = await this.mastraService.generateArticle(
			videoId,
			plainText
		)

		let slug: VideoArticle["slug"]

		await this.uow.run(async (trx) => {
			const article = await this.videoArticleRepo.upsert(
				{
					videoId,
					title: articleData.title,
					description: articleData.description,
					globalSummary: articleData.globalSummary,
					sections: articleData.sections,
					article: articleData.article,
					slug: this.createSlug(articleData.title),
				},
				trx
			)

			slug = article.slug

			await this.videoRepo.updateStatus(
				videoId,
				{
					status: "done",
					statusMessage: "Статья создана",
				},
				trx
			)
		})

		// biome-ignore lint/style/noNonNullAssertion: slug всегда есть
		await this.revalidationService.revalidateTags([`article:${slug!}`])
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
