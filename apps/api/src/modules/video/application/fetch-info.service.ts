import { Injectable } from "@nestjs/common"
import { AppConfigService } from "src/infra/app-config/app-config.service"
import { VideoInfo, YtDlp } from "ytdlp-nodejs"
import { VideoRepo } from "../data/video.repo"
import { VideoInfoRepo } from "../data/video-info.repo"
import { type FetchInfoJobData } from "./video-jobs.contract"
import { VideoJobsService } from "./video-jobs.service"

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

		await this.fetchAndSaveInfo(videoId, externalId)
		await this.videoJobsService.enqueueFetchCaptions({ videoId, externalId })
	}

	async markFailed(videoId: string, message: string) {
		await this.videoRepo.updateStatus(videoId, {
			status: "error",
			statusMessage: message,
		})
	}

	private async fetchAndSaveInfo(videoId: string, youtubeId: string) {
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
	}
}
