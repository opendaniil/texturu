import { Processor, WorkerHost } from "@nestjs/bullmq"
import { Inject, Injectable } from "@nestjs/common"
import { Job } from "bullmq"
import { AppConfigService } from "src/infra/app-config/app-config.service"
import { QUEUES } from "src/infra/queue/queue.module"
import { VideoInfo, YtDlp } from "ytdlp-nodejs"
import { VideoRepo } from "../video/video.repo"
import { VideoJobsService } from "./video-jobs.service"

type ProcessPayload = { videoId: string; externalId: string }
const TARGET_SUBTITLE_LANGS = ["ru", "en"] as const

type SubtitleTrack = {
	ext: string
	url: string
	name: string
}

@Processor(QUEUES.VIDEO_JOB)
@Injectable()
export class VideoJobWorker extends WorkerHost {
	private readonly ytdlp: YtDlp
	constructor(
		private readonly videoJobsService: VideoJobsService,
		private readonly videoRepo: VideoRepo,
		@Inject() private readonly appConfig: AppConfigService
	) {
		super()
		this.ytdlp = new YtDlp({
			binaryPath: "/usr/bin/yt-dlp",
		})
	}

	async process(job: Job<ProcessPayload>) {
		console.log(">", JSON.stringify({ job }, null, 2))

		const { videoId, externalId } = job.data

		if (job.name === "fetching_captions") {
			await this.videoJobsService.markRunning(videoId)
			await this.videoRepo.updateStatus(videoId, {
				status: "processing",
				statusMessage: "",
			})

			try {
				await this.downloadSubtitles(videoId, externalId)
				await this.videoJobsService.markDone(videoId)
			} catch (error) {
				await this.videoJobsService.markError(videoId)
				await this.videoRepo.updateStatus(videoId, {
					status: "error",
					statusMessage: error instanceof Error ? error.message : "Unknown error",
				})
				throw error
			}
		}

		return
	}

	private async downloadSubtitles(videoId: string, youtubeId: string) {
		const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`
		const proxy = this.appConfig.get("YTDLP_PROXY")

		const info = await this.ytdlp.getInfoAsync(youtubeUrl, {
			// @ts-expect-error
			rawArgs: ["--proxy", proxy],
		})

		if ("playlist_count" in info) {
			throw new Error("Playlist not supported")
		} else {
			const videoInfo = info as VideoInfo
			const title = videoInfo.title
			const subtitles = videoInfo.subtitles
			const automaticCaptions = videoInfo.automatic_captions
			const targetSubtitles = this.grabTargetSubtitles(
				subtitles,
				automaticCaptions
			)

			const hasSubtitles = Object.keys(targetSubtitles).length > 0
			await this.videoRepo.updateCaptionsResult(videoId, {
				status: "done",
				statusMessage: hasSubtitles ? "" : "No subtitles found for target languages",
				meta: hasSubtitles
					? { title, subtitles: targetSubtitles }
					: { title, subtitles: {} },
			})
		}
	}

	private grabTargetSubtitles(
		subtitles: VideoInfo["subtitles"],
		autoCaptions: VideoInfo["automatic_captions"]
	) {
		const result: Record<
			string,
			{ source: "subtitles" | "automatic_captions"; track: SubtitleTrack }
		> = {}

		for (const lang of TARGET_SUBTITLE_LANGS) {
			const subtitleTrack = this.findSubtitleTrack(subtitles, lang)
			if (subtitleTrack) {
				result[lang] = {
					source: "subtitles",
					track: subtitleTrack,
				}
				continue
			}

			const autoTrack = this.findSubtitleTrack(autoCaptions, lang)
			if (autoTrack) {
				result[lang] = {
					source: "automatic_captions",
					track: autoTrack,
				}
			}
		}

		return result
	}

	private findSubtitleTrack(
		subs: VideoInfo["subtitles"],
		lang: string
	): SubtitleTrack | null {
		const key =
			Object.keys(subs).find((k) => k === lang) ||
			Object.keys(subs).find((k) => k.startsWith(`${lang}-`))

		if (!key) {
			return null
		}

		const group = subs[key]
		return group.find((s) => s.ext === "json3") || group[0] || null
	}
}
