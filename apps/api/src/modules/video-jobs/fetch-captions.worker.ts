import { createReadStream } from "node:fs"
import { readdir, readFile, rm } from "node:fs/promises"
import { join } from "node:path"
import { Writable } from "node:stream"
import { Processor, WorkerHost } from "@nestjs/bullmq"
import { Inject, Injectable, Logger } from "@nestjs/common"
import { Job } from "bullmq"
import { AppConfigService } from "src/infra/app-config/app-config.service"
import { QUEUES } from "src/infra/queue/queue.module"
import { parse } from "subtitle"
import { YtDlp } from "ytdlp-nodejs"
import { VideoRepo } from "../video/video.repo"
import { VideoCaptionRepo } from "../video/video-caption.repo"
import { VideoJobsService } from "./video-jobs.service"

type ProcessPayload = { videoId: string; externalId: string }

@Processor(QUEUES.FETCHING_CAPTIONS)
@Injectable()
export class FetchCaptionsWorker extends WorkerHost {
	private logger = new Logger(FetchCaptionsWorker.name)
	private readonly ytdlp: YtDlp
	constructor(
		private readonly videoJobsService: VideoJobsService,
		private readonly videoRepo: VideoRepo,
		private readonly videoCaptionRepo: VideoCaptionRepo,
		private readonly appConfig: AppConfigService
	) {
		super()
		this.ytdlp = new YtDlp({
			binaryPath: "/usr/bin/yt-dlp",
		})
	}

	async process(job: Job<ProcessPayload>) {
		console.log(">", JSON.stringify({ job }, null, 2))

		const { videoId, externalId } = job.data

		if (job.name === QUEUES.FETCHING_CAPTIONS) {
			await this.videoJobsService.markRunning(videoId)
			await this.videoRepo.updateStatus(videoId, {
				status: "processing",
				statusMessage: "fetching captions",
			})

			try {
				await this.downloadAndSaveSubtitles(videoId, externalId)
				await this.videoJobsService.markDone(videoId)
			} catch (error) {
				this.logger.error(error)
				await this.videoJobsService.markError(videoId)
				await this.videoRepo.updateStatus(videoId, {
					status: "error",
					statusMessage:
						error instanceof Error ? error.message : "Unknown error",
				})
				throw error
			}
		}

		return
	}

	private async downloadAndSaveSubtitles(videoId: string, youtubeId: string) {
		const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`
		const proxy = this.appConfig.get("YOUTUBE_PROXY")

		try {
			await this.removeTempSubtitles(videoId)

			await this.ytdlp
				.download(youtubeUrl)
				.proxy(proxy)
				.setOutputTemplate(`temp/${videoId}/%(id)s.%(ext)s`)
				.addOption("subFormat", "vtt")
				.writeSubs()
				.writeAutoSubs()
				.subLangs(["en"])
				.skipDownload()
				.run()
				.catch(() => {}) // Ошибки yt‑dlp игнорируются, они непредсказуемы и не влияют на получение субтитров

			const path = await this.getSubtitles(videoId)

			const vttText = await this.readFile(path)
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

	private async removeTempSubtitles(videoId: string) {
		const tempDir = join(process.cwd(), "temp", videoId)
		await rm(tempDir, { recursive: true, force: true })
	}

	private async getSubtitles(videoId: string): Promise<string> {
		const tempDir = join(process.cwd(), "temp", videoId)

		const entries = await readdir(tempDir, { withFileTypes: true })
		const file = entries.find((e) => e.isFile() && e.name.endsWith(".en.vtt"))

		if (!file) {
			throw new Error(`No .vtt subtitle files found for video ${videoId}`)
		}

		const path = join(tempDir, file.name)
		return path
	}

	private readFile(path: string) {
		return readFile(path, { encoding: "utf8" })
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
