import { Processor, WorkerHost } from "@nestjs/bullmq"
import { Injectable } from "@nestjs/common"
import { Job } from "bullmq"
import { UowService } from "src/infra/database/unit-of-work.service"
import { QUEUES } from "src/infra/queue/queue.module"
import { VideoRepo } from "./video.repo"
import { VideoJobRepo } from "./video-job.repo"

type ProcessPayload = { videoId: string }

@Processor(QUEUES.VIDEO_JOB)
@Injectable()
export class VideoJobWorker extends WorkerHost {
	constructor(
		private readonly uow: UowService,
		private readonly videoJobRepo: VideoJobRepo,
		private readonly videoRepo: VideoRepo
	) {
		super()
	}

	async process(job: Job<ProcessPayload>) {
		console.log(">", JSON.stringify({ job }, null, 2))

		return
		// if (job.name !== "process") return

		// const { videoId } = job.data

		// await this.uow.run(async (trx) => {
		// 	const claimed = await this.videoJobRepo.claim(videoId, trx)
		// 	if (!claimed) {
		// 		// уже обработано/в процессе/ошибка — значит это дубль сигнала
		// 		return
		// 	}

		// 	try {
		// 		const video = await this.videoRepo.findById(videoId, trx)
		// 		if (!video) throw new Error("Video not found")

		// 		// TODO: твоя логика обработки видео (скачивание субтитров, транскодинг, etc)
		// 		// Тут же обновляй videos.status / statusMessage

		// 		await this.videoJobRepo.markDone(videoId, trx)
		// 	} catch (e: any) {
		// 		await this.videoJobRepo.markError(videoId, String(e?.message ?? e), trx)
		// 		throw e // чтобы BullMQ тоже видел fail (для метрик/событий)
		// 	}
		// })
	}
}
