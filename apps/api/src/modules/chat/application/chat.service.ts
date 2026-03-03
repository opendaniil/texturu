import { toAISdkStream } from "@mastra/ai-sdk"
import { MastraClient } from "@mastra/client-js"
import { RequestContext } from "@mastra/core/request-context"
import type { ChunkType, MastraModelOutput } from "@mastra/core/stream"
import { Injectable } from "@nestjs/common"
import {
	type ChatHistoryQuery,
	type ChatHistoryResponse,
	type ChatRequest,
	type ChatRequestContext,
	VideoArticleResponse,
} from "@texturu/schemas"
import type { UIMessageChunk } from "ai"
import { AppConfigService } from "src/infra/app-config/app-config.service"
import { VideoArticleRepo } from "src/modules/video/data/video-article.repo"
import { VideoInfoRepo } from "src/modules/video/data/video-info.repo"

type ChatReplyParams = ChatRequest & {
	anonId: string
}

type ChatHistoryParams = ChatHistoryQuery & {
	anonId: string
}

type MastraAgentStreamResponse = {
	body?: ReadableStream<Uint8Array> | null
	processDataStream: (options: {
		onChunk: (chunk: ChunkType) => void | Promise<void>
	}) => Promise<void>
}

@Injectable()
export class ChatService {
	private readonly client: MastraClient
	private readonly articleAgentId = "articleAgent"
	private readonly streamCancelDrainTimeoutMs = 5_000
	private readonly historyLoadLimit = 40

	constructor(
		private readonly config: AppConfigService,
		private readonly videoArticleRepo: VideoArticleRepo,
		private readonly videoInfoRepo: VideoInfoRepo
	) {
		this.client = new MastraClient({
			baseUrl: this.config.mastraBaseUrl,
		})
	}

	async streamResponse({
		articleId,
		message,
		anonId,
	}: ChatReplyParams): Promise<ReadableStream<UIMessageChunk>> {
		const requestContext = await this.getContext(articleId)
		if (!requestContext) {
			throw new Error("Failed to get context")
		}

		const agentResponse = await this.createAgentStream({
			articleId,
			message,
			anonId,
			requestContext,
		})

		return this.toUIChunkSource(agentResponse) as ReadableStream<UIMessageChunk>
	}

	async getHistory({
		articleId,
		anonId,
	}: ChatHistoryParams): Promise<ChatHistoryResponse> {
		const threadId = this.getThreadId(articleId, anonId)
		const resourceId = this.getResourceId(anonId)

		try {
			const result = await this.client
				.getMemoryThread({ threadId, agentId: this.articleAgentId })
				.listMessages({
					resourceId,
					page: 0,
					perPage: this.historyLoadLimit,
					orderBy: {
						field: "createdAt",
						direction: "ASC",
					},
				})

			const messages = result.messages.map((message) => ({
				id: message.id,
				role: message.role,
				parts: message.content.parts,
			}))

			return {
				messages,
			}
		} catch (error) {
			if (error?.status === 404) {
				return {
					messages: [],
				}
			}

			throw error
		}
	}

	private async createAgentStream({
		articleId,
		message,
		anonId,
		requestContext,
	}: {
		articleId: string
		message: string
		anonId: string
		requestContext: RequestContext
	}): Promise<MastraAgentStreamResponse> {
		const articleAgent = this.client.getAgent(this.articleAgentId)
		return articleAgent.stream(
			[
				{
					role: "user",
					content: message,
				},
			],
			{
				memory: {
					thread: this.getThreadId(articleId, anonId),
					resource: this.getResourceId(anonId),
				},
				requestContext,
				maxSteps: 5,
			}
		)
	}

	private getThreadId(articleId: string, anonId: string): string {
		return `chat:article:${articleId}:anon:${anonId}`
	}

	private getResourceId(anonId: string): string {
		return `user:anon:${anonId}`
	}

	private async getContext(articleId: string): Promise<RequestContext | null> {
		const article = await this.videoArticleRepo.findById(articleId)
		if (!article) {
			return null
		}

		const info = await this.videoInfoRepo.findByVideoId(article.videoId)
		if (!info) {
			return null
		}

		const contextValues: ChatRequestContext = {
			articleId,
			articleTitle: article.title,
			articleDescription: article.description,
			articleSummary: article.globalSummary,
			articleSectionsToc: this.buildSectionsToc(article.sections),
			articleUploadedBy: info.channelTitle,
			articleUploadedAt: info.uploadDate,
		}

		const rc = new RequestContext()
		rc.set("articleId", contextValues.articleId)
		rc.set("articleTitle", contextValues.articleTitle)
		rc.set("articleDescription", contextValues.articleDescription)
		rc.set("articleSummary", contextValues.articleSummary)
		rc.set("articleSectionsToc", contextValues.articleSectionsToc)
		rc.set("articleUploadedBy", contextValues.articleUploadedBy)
		rc.set("articleUploadedAt", contextValues.articleUploadedAt)

		return rc
	}

	private buildSectionsToc(sections: VideoArticleResponse["sections"]): string {
		return sections
			.map((section) => `${section.number}. ${section.title}`)
			.join("; ")
	}

	private toUIChunkSource(
		agentResponse: MastraAgentStreamResponse
	): ReturnType<typeof toAISdkStream> {
		type MastraAgentOutputLike = {
			fullStream: MastraModelOutput["fullStream"]
		}

		// собираем стрим агента в единый поток чанков
		const mastraChunkStream = this.toMastraChunkStream(agentResponse)
		const streamLike = {
			fullStream: mastraChunkStream as MastraModelOutput["fullStream"],
		} satisfies MastraAgentOutputLike

		// конвертируем поток ответа в формат который ожидает UI
		return toAISdkStream(streamLike as MastraModelOutput, {
			from: "agent",
			sendReasoning: false,
			sendSources: false,
		})
	}

	private toMastraChunkStream(
		agentResponse: MastraAgentStreamResponse
	): ReadableStream<ChunkType> {
		let isCancelled = false
		let streamProcessingPromise: Promise<void> | null = null

		return new ReadableStream<ChunkType>({
			start: (controller) => {
				streamProcessingPromise = agentResponse
					.processDataStream({
						onChunk: (chunk) => {
							if (isCancelled) {
								return
							}

							controller.enqueue(chunk)
						},
					})
					.then(() => {
						if (isCancelled) {
							return
						}

						controller.close()
					})
					.catch((error: unknown) => {
						if (isCancelled) {
							return
						}

						controller.error(error)
					})
			},
			cancel: async () => {
				isCancelled = true

				try {
					await agentResponse.body?.cancel()
				} catch {
					// ignore upstream cancel errors
				}

				try {
					// при отмене стрима или разрыве соединения
					await this.waitForProcessingShutdownWithTimeout(
						streamProcessingPromise
					)
				} catch {
					// ignore processing errors after cancellation
				}
			},
		})
	}

	private async waitForProcessingShutdownWithTimeout(
		streamProcessingPromise: Promise<void> | null
	): Promise<void> {
		if (!streamProcessingPromise) {
			return
		}

		let timeoutId: ReturnType<typeof setTimeout> | null = null
		try {
			await Promise.race([
				streamProcessingPromise,
				new Promise<void>((resolve) => {
					timeoutId = setTimeout(resolve, this.streamCancelDrainTimeoutMs)
				}),
			])
		} finally {
			if (timeoutId) {
				clearTimeout(timeoutId)
			}
		}
	}
}
