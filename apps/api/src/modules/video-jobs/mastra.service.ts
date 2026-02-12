import { MastraClient } from "@mastra/client-js"
import { Injectable } from "@nestjs/common"
import { AppConfigService } from "src/infra/app-config/app-config.service"

@Injectable()
export class MastraService {
	client: MastraClient

	constructor(private readonly env: AppConfigService) {
		this.client = new MastraClient({
			baseUrl: this.env.get("MASTRA_HOST"),
		})
	}

	async generateArticle(
		subtitles: string
	): Promise<{ title: string; article: string }> {
		const workflow = this.client.getWorkflow("articleWorkflow")
		const run = await workflow.createRun()

		const result = await run.startAsync({
			inputData: {
				subtitles,
			},
		})

		if (result.status !== "success") {
			throw new Error("Workflow failed to generate article")
		}

		const payload = result.result as {
			title: string
			article: string
		}

		return {
			title: payload.title,
			article: payload.article,
		}
	}
}
