import { MastraClient } from "@mastra/client-js"
import { RequestContext } from "@mastra/core/request-context"
import { BadGatewayException, Injectable } from "@nestjs/common"
import {
	type ChatRequest,
	type ChatResponse,
	chatResponseSchema,
} from "@tubebook/schemas"
import { AppConfigService } from "src/infra/app-config/app-config.service"

@Injectable()
export class ChatService {
	private readonly client: MastraClient
	private readonly articleAgentId = "articleAgent"

	constructor(private readonly config: AppConfigService) {
		this.client = new MastraClient({
			baseUrl: this.config.get("MASTRA_HOST"),
		})
	}

	async reply({ message }: ChatRequest): Promise<ChatResponse> {
		const responseMessage = await this.generateResponse(message)

		return chatResponseSchema.parse({
			message: responseMessage,
		})
	}

	private async generateResponse(message: string): Promise<string> {
		const videoId = "019c89eb-16a1-76c8-882f-099676ad55c0"

		try {
			const requestContext = new RequestContext()
			requestContext.set("article", videoId)

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
						thread: "demo",
						resource: "demo",
					},
					requestContext,
				}
			)

			const responseMessage = response.text.trim()
			if (!responseMessage) {
				throw new Error("articleAgent returned an empty message")
			}

			return responseMessage
		} catch {
			throw new BadGatewayException("Failed to get response from articleAgent")
		}
	}
}
