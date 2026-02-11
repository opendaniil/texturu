import { Processor, WorkerHost } from "@nestjs/bullmq"
import { Injectable, Logger } from "@nestjs/common"
import { Job } from "bullmq"
import { QUEUES } from "src/infra/queue/queue.module"
import { VideoRepo } from "../video/video.repo"
import { VideoCaptionRepo } from "../video/video-caption.repo"
import { MastraService } from "./mastra.service"

type ProcessPayload = { videoId: string }

@Processor(QUEUES.GENERATE_ARTICLE)
@Injectable()
export class GenerateArticleWorker extends WorkerHost {
	private logger = new Logger(GenerateArticleWorker.name)

	constructor(
		private readonly mastraService: MastraService,
		private readonly videoRepo: VideoRepo,
		private readonly videoCaptionRepo: VideoCaptionRepo
	) {
		super()
	}

	async process(job: Job<ProcessPayload>) {
		const { videoId } = job.data

		if (job.name === QUEUES.GENERATE_ARTICLE) {
			const plainText =
				await this.videoCaptionRepo.findPlainTextByVideoId(videoId)
			if (!plainText) {
				throw new Error(`No plain text found for video ${videoId}`)
			}

			const response = await this.mastraService.generateArticle(plainText)
			await this.videoRepo.updateStatus(videoId, {
				status: "done",
				statusMessage: "article generated",
			})
		}

		return
	}
}
