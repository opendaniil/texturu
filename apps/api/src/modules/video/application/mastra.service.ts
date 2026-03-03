import { MastraClient } from "@mastra/client-js"
import { Injectable } from "@nestjs/common"
import {
	type ArticleWorkflowOutput,
	articleWorkflowOutputSchema,
} from "@texturu/schemas"
import { AppConfigService } from "src/infra/app-config/app-config.service"

@Injectable()
export class MastraService {
	private client: MastraClient

	constructor(private readonly env: AppConfigService) {
		this.client = new MastraClient({
			baseUrl: this.env.mastraBaseUrl,
		})
	}

	async generateArticle(
		videoId: string,
		subtitles: string
	): Promise<ArticleWorkflowOutput> {
		const workflow = this.client.getWorkflow("createArticleWorkflow")
		const run = await workflow.createRun()

		const result = await run.startAsync({
			inputData: {
				subtitles,
				videoId,
			},
		})

		if (result.status !== "success") {
			throw new Error("Workflow failed to generate article")
		}

		return articleWorkflowOutputSchema.parse(result.result)
	}
}
