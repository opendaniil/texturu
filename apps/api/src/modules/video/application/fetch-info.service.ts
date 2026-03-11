import { Injectable } from "@nestjs/common"
import { AppConfigService } from "src/infra/app-config/app-config.service"
import { VideoInfo, YtDlp } from "ytdlp-nodejs"
import { VideoRepo } from "../data/video.repo"
import { VideoInfoRepo } from "../data/video-info.repo"
import { type FetchInfoJobData } from "./video-jobs.contract"
import { VideoJobsService } from "./video-jobs.service"

const MAX_VIDEO_DURATION_SECONDS = 180 * 60 // 3 часа

@Injectable()
export class FetchInfoService {
	private readonly ytdlp: YtDlp

	constructor(
		private readonly videoJobsService: VideoJobsService,
		private readonly videoRepo: VideoRepo,
		private readonly videoInfoRepo: VideoInfoRepo,
		private readonly appConfig: AppConfigService
	) {
		this.ytdlp = new YtDlp({
			binaryPath: "/usr/bin/yt-dlp",
		})
	}

	async process({ videoId, externalId }: FetchInfoJobData) {
		await this.videoRepo.updateStatus(videoId, {
			status: "fetching_info",
			statusMessage: "Получение информации о видео",
		})

		const { duration } = await this.fetchAndSaveInfo(videoId, externalId)

		if (duration > MAX_VIDEO_DURATION_SECONDS) {
			const durationMin = Math.round(duration / 60)
			const limitMin = MAX_VIDEO_DURATION_SECONDS / 60
			await this.markFailed(
				videoId,
				`Видео слишком длинное (${durationMin} мин). Максимум — ${limitMin} мин`
			)
			return
		}

		await this.videoJobsService.enqueueFetchCaptions({ videoId, externalId })
	}

	async markFailed(videoId: string, message: string) {
		await this.videoRepo.updateStatus(videoId, {
			status: "error",
			statusMessage: message,
		})
	}

	private async fetchAndSaveInfo(
		videoId: string,
		youtubeId: string
	): Promise<{ duration: number }> {
		const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`
		const proxy = this.appConfig.get("YOUTUBE_PROXY")

		const info = await this.ytdlp.getInfoAsync(youtubeUrl, {
			// @ts-expect-error @types/ytdlp-nodejs не содержит rawArgs, но работает
			rawArgs: ["--proxy", proxy],
		})

		const {
			fulltitle,
			channel_id: channelId,
			channel: channelTitle,
			thumbnail,
			duration,
			categories,
			tags,
			language,
			upload_date: uploadDate,
		} = info as VideoInfo

		await this.videoInfoRepo.upsertByVideoId({
			videoId,
			...{
				fulltitle,
				thumbnail,
				channelId,
				channelTitle,
				duration,
				categories,
				tags,
				language,
				uploadDate,
			},
		})

		return { duration }
	}
}
