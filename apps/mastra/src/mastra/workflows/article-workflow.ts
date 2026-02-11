import { createStep, createWorkflow } from "@mastra/core/workflows"
import z from "zod"

const createArticle = createStep({
	id: "create-article",
	description: "Generates an article from subtitles",
	inputSchema: z.object({
		subtitles: z.string().describe("Video subtitles"),
	}),
	outputSchema: z.object({
		article: z.string().describe("Generated MD article"),
	}),
	execute: async ({ inputData, mastra }) => {
		const { subtitles } = inputData

		const agent = mastra?.getAgent("articleAgent")
		if (!agent) {
			throw new Error("Article agent not found")
		}

		const answer = await agent.generate([
			{
				role: "user",
				content: `
				ОБРАБОТАЙ ЭТИ СУБТИТРЫ:
				${subtitles}
				`,
			},
		])

		return {
			article: answer.text,
		}
	},
})

const articleWorkflow = createWorkflow({
	id: "article-workflow",
	inputSchema: z.object({
		subtitles: z.string().describe("Video subtitles"),
	}),
	outputSchema: z.object({
		article: z.string().describe("Generated MD article"),
	}),
}).then(createArticle)

articleWorkflow.commit()

export { articleWorkflow }
