import { createReadStream } from "node:fs"
import { readdir, readFile, rm } from "node:fs/promises"
import { join } from "node:path"
import { Writable } from "node:stream"
import { Injectable } from "@nestjs/common"
import { AppConfigService } from "src/infra/app-config/app-config.service"
import { parse } from "subtitle"
import { YtDlp } from "ytdlp-nodejs"
import { VideoRepo } from "../data/video.repo"
import { VideoCaptionRepo } from "../data/video-caption.repo"
import { type FetchCaptionsJobData } from "./video-jobs.contract"
import { VideoJobsService } from "./video-jobs.service"

@Injectable()
export class FetchCaptionsService {
	private readonly ytdlp: YtDlp

	constructor(
		private readonly videoJobsService: VideoJobsService,
		private readonly videoRepo: VideoRepo,
		private readonly videoCaptionRepo: VideoCaptionRepo,
		private readonly appConfig: AppConfigService
	) {
		this.ytdlp = new YtDlp({
			binaryPath: "/usr/bin/yt-dlp",
		})
	}

	async process({ videoId, externalId }: FetchCaptionsJobData) {
		await this.videoRepo.updateStatus(videoId, {
			status: "fetching_captions",
			statusMessage: "Получение субтитров",
		})

		await this.downloadAndSaveSubtitles(videoId, externalId)
		await this.videoJobsService.enqueueGenerateArticle({ videoId })
	}

	async markFailed(videoId: string, message: string) {
		await this.videoRepo.updateStatus(videoId, {
			status: "error",
			statusMessage: message,
		})
	}

	private async downloadAndSaveSubtitles(videoId: string, youtubeId: string) {
		const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`
		const proxy = this.appConfig.get("YOUTUBE_PROXY")

		try {
			// list-subs не работает, поэтому скачиваем перебором первые доступные
			const langPriority = ["en-orig", "ru-orig", "en", "ru"]
			await this.removeTempSubtitles(videoId)

			let path: string | null = null
			for (const lang of langPriority) {
				await this.removeTempSubtitles(videoId)

				await this.ytdlp
					.download(youtubeUrl)
					.proxy(proxy)
					.setOutputTemplate(`temp/${videoId}/%(id)s.%(ext)s`)
					.addOption("subFormat", "vtt")
					.writeSubs()
					.writeAutoSubs()
					.subLangs([lang])
					.skipDownload()
					.run()
					.catch() // Ошибки yt-dlp игнорируются, они непредсказуемы и не влияют на получение субтитров

				path = await this.getSubtitlePath(videoId)
				if (path) {
					break
				}
			}

			if (!path) {
				throw new Error(`No .vtt subtitle files found for video ${videoId}`)
			}

			const vttText = await readFile(path, { encoding: "utf8" })
			const plainText = await this.convertToPlainText(path)

			await this.videoCaptionRepo.upsertByVideoId({
				videoId,
				vttText,
				plainText,
			})
		} finally {
			await this.removeTempSubtitles(videoId)
		}
	}

	private async getSubtitlePath(videoId: string): Promise<string | null> {
		const tempDir = join(process.cwd(), "temp", videoId)

		const entries = await readdir(tempDir, { withFileTypes: true })
		const file = entries.find((e) => e.isFile() && e.name.endsWith(".vtt"))

		if (!file) {
			return null
		}

		const path = join(tempDir, file.name)
		return path
	}

	private async removeTempSubtitles(videoId: string) {
		const tempDir = join(process.cwd(), "temp", videoId)
		await rm(tempDir, { recursive: true, force: true })
	}

	private convertToPlainText(path: string): Promise<string> {
		const cues: string[] = []

		const normalizeCueText = (s: string) =>
			s
				.replace(/<\d{2}:\d{2}:\d{2}\.\d{3}>/g, " ")
				.replace(/<\/?c[.\w-]*>/gi, " ")
				.replace(/&gt;/gi, " ")
				.replace(/&#62;/g, " ")
				.replace(/\[[^\]]*\]/g, " ")
				.replace(/<\/?[^>]+>/g, " ")
				.replace(/\u00A0/g, " ")
				.replace(/\s+/g, " ")
				.trim()

		const sameToken = (a: string, b: string) =>
			a.toLowerCase() === b.toLowerCase()

		const findOverlap = (out: string[], next: string[]) => {
			const max = Math.min(out.length, next.length)
			for (let k = max; k >= 2; k--) {
				let matches = true
				for (let i = 0; i < k; i++) {
					if (!sameToken(out[out.length - k + i], next[i])) {
						matches = false
						break
					}
				}
				if (matches) {
					return k
				}
			}
			return 0
		}

		return new Promise<string>((resolve, reject) => {
			const sink = new Writable({
				objectMode: true,
				// biome-ignore lint/suspicious/noExplicitAny: нет точного типа
				write(node: any, _enc, cb) {
					if (node?.type === "cue") {
						const t = node.data?.text
						if (typeof t === "string" && t.length) {
							const normalized = normalizeCueText(t)
							if (normalized) cues.push(normalized)
						}
					}
					cb()
				},
			})

			createReadStream(path, { encoding: "utf8" })
				.pipe(parse())
				.pipe(sink)
				.on("finish", () => {
					const outWords: string[] = []
					for (const cue of cues) {
						const words = cue.split(" ").filter(Boolean)
						if (words.length === 0) continue

						const overlap = findOverlap(outWords, words)
						if (overlap >= 2) {
							outWords.push(...words.slice(overlap))
							continue
						}

						const lastOutWord = outWords[outWords.length - 1]
						const firstWord = words[0]
						if (lastOutWord && firstWord && sameToken(lastOutWord, firstWord)) {
							if (words.length === 1) continue
							outWords.push(...words.slice(1))
							continue
						}

						outWords.push(...words)
					}

					const plainText = outWords.join(" ").replace(/\s+/g, " ").trim()
					resolve(plainText)
				})
				.on("error", reject)
		})
	}
}
