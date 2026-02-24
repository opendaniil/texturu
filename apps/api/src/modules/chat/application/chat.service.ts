import { MastraClient } from "@mastra/client-js"
import { RequestContext } from "@mastra/core/request-context"
import { BadGatewayException, Injectable } from "@nestjs/common"
import {
	type ChatRequest,
	type ChatRequestContext,
	type ChatResponse,
} from "@tubebook/schemas"
import { AppConfigService } from "src/infra/app-config/app-config.service"
import { VideoArticleRepo } from "src/modules/video/data/video-article.repo"
import { VideoInfoRepo } from "src/modules/video/data/video-info.repo"

type ChatReplyParams = ChatRequest & {
	anonId: string
}

@Injectable()
export class ChatService {
	private readonly client: MastraClient
	private readonly articleAgentId = "articleAgent"

	constructor(
		private readonly config: AppConfigService,
		private readonly videoArticleRepo: VideoArticleRepo,
		private readonly videoInfoRepo: VideoInfoRepo
	) {
		this.client = new MastraClient({
			baseUrl: this.config.get("MASTRA_HOST"),
		})
	}

	async generateResponse({
		articleId,
		message,
		anonId,
	}: ChatReplyParams): Promise<ChatResponse> {
		const requestContext = await this.getContext(articleId)
		if (!requestContext) {
			throw new BadGatewayException("Failed to get article context")
		}

		const articleAgent = this.client.getAgent(this.articleAgentId)
		const response = await articleAgent.generate(
			[
				{
					role: "user",
					content: message,
				},
			],
			{
				memory: {
					thread: `chat:article:${articleId}:anon:${anonId}`,
					resource: `user:anon:${anonId}`,
				},
				requestContext,
				maxSteps: 2,
			}
		)

		return {
			message: response.text,
		}
	}

	private async getContext(articleId: string): Promise<RequestContext | null> {
		const [article, info] = await Promise.all([
			this.videoArticleRepo.findByVideoId(articleId),
			this.videoInfoRepo.findByVideoId(articleId),
		])

		if (!article || !info) {
			return null
		}

		const contextValues: ChatRequestContext = {
			articleId,
			articleTitle: article.title,
			articleShortDescription: article.description,
			articleUploadedBy: info.channelTitle,
			articleUploadedAt: info.uploadDate,
		}

		const rc = new RequestContext()
		rc.set("articleId", contextValues.articleId)
		rc.set("articleTitle", contextValues.articleTitle)
		rc.set("articleShortDescription", contextValues.articleShortDescription)
		rc.set("articleUploadedBy", contextValues.articleUploadedBy)
		rc.set("articleUploadedAt", contextValues.articleUploadedAt)

		return rc
	}
}
