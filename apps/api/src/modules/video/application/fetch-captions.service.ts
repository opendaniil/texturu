import { createReadStream } from "node:fs"
import { readdir, readFile, rm } from "node:fs/promises"
import { join } from "node:path"
import { Writable } from "node:stream"
import { Injectable } from "@nestjs/common"
import { AppConfigService } from "src/infra/app-config/app-config.service"
import { parse } from "subtitle"
import { Exec, YtDlp } from "ytdlp-nodejs"
import { VideoRepo } from "../data/video.repo"
import { VideoCaptionRepo } from "../data/video-caption.repo"
import { CaptionsNotFoundError, SubtitleDownloadError } from "./video.errors"
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
			const subtitleInfo = await this.fetchSubtitleInfo(youtubeUrl, proxy)
			const selected = this.selectBestSubtitleLang(subtitleInfo)

			if (!selected) {
				throw new CaptionsNotFoundError(videoId)
			}

			await this.removeTempSubtitles(videoId)

			const builder = this.ytdlp
				.download(youtubeUrl)
				.proxy(proxy)
				.setOutputTemplate(`temp/${videoId}/%(id)s.%(ext)s`)
				.addOption("subFormat", "vtt")
				.subLangs([selected.lang])
				.skipDownload()

			if (selected.isAuto) {
				builder.writeAutoSubs()
			} else {
				builder.writeSubs()
			}

			await builder.run().catch() // ошибки yt-dlp игнорируются, они непредсказуемы и не влияют на получение субтитров

			const path = await this.getSubtitlePath(videoId)

			if (!path) {
				throw new SubtitleDownloadError(videoId)
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

	private async fetchSubtitleInfo(
		youtubeUrl: string,
		proxy: string
	): Promise<{
		subtitles: Record<string, unknown>
		autoCaptions: Record<string, unknown>
	}> {
		const exec = new Exec(youtubeUrl, {
			binaryPath: "/usr/bin/yt-dlp",
		}).addArgs("--dump-single-json", "--skip-download")

		if (proxy) exec.proxy(proxy)

		const result = await exec.exec().catch(() => null)

		if (!result?.stdout) {
			return { subtitles: {}, autoCaptions: {} }
		}

		try {
			const info = JSON.parse(result.stdout) as {
				subtitles?: Record<string, unknown>
				automatic_captions?: Record<string, unknown>
			}
			return {
				subtitles: info.subtitles ?? {},
				autoCaptions: info.automatic_captions ?? {},
			}
		} catch {
			return { subtitles: {}, autoCaptions: {} }
		}
	}

	private selectBestSubtitleLang(info: {
		subtitles: Record<string, unknown>
		autoCaptions: Record<string, unknown>
	}): { lang: string; isAuto: boolean } | null {
		const { subtitles, autoCaptions } = info

		if (subtitles["en"]) return { lang: "en", isAuto: false }
		if (autoCaptions["en-orig"]) return { lang: "en-orig", isAuto: true }
		if (subtitles["ru"]) return { lang: "ru", isAuto: false }
		if (autoCaptions["ru-orig"]) return { lang: "ru-orig", isAuto: true }

		const firstManual = Object.keys(subtitles)[0]
		if (firstManual) return { lang: firstManual, isAuto: false }

		const origLang = Object.keys(autoCaptions).find((k) => k.endsWith("-orig"))
		if (origLang) return { lang: origLang, isAuto: true }

		return null
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
