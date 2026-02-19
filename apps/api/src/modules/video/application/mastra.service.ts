import { MastraClient } from "@mastra/client-js"
import { Injectable } from "@nestjs/common"
import {
	type ArticleWorkflowOutput,
	articleWorkflowInputSchema,
	articleWorkflowOutputSchema,
} from "@tubebook/schemas"
import { AppConfigService } from "src/infra/app-config/app-config.service"

@Injectable()
export class MastraService {
	client: MastraClient

	constructor(private readonly env: AppConfigService) {
		this.client = new MastraClient({
			baseUrl: this.env.get("MASTRA_HOST"),
		})
	}

	async generateArticle(subtitles: string): Promise<ArticleWorkflowOutput> {
		const workflow = this.client.getWorkflow("createArticleWorkflow")
		const run = await workflow.createRun()
		const inputData = articleWorkflowInputSchema.parse({ subtitles })

		const result = await run.startAsync({
			inputData,
		})

		if (result.status !== "success") {
			throw new Error("Workflow failed to generate article")
		}

		return articleWorkflowOutputSchema.parse(result.result)
	}
}
