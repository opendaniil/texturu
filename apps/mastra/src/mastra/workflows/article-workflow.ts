import { createStep, createWorkflow } from "@mastra/core/workflows"
import {
	articleWorkflowInputSchema,
	articleWorkflowOutputSchema,
} from "@tubebook/schemas"
import z from "zod"

const articleResultSchema = z.object({
	title: z.string().describe("цепляющее название, ёмкое и краткое, 5-10 слов"),
	description: z
		.string()
		.describe("подробное описание статьи на 2-4 предложения (60-120 слов)"),
	article: z.string().describe("статья md"),
})

const createArticle = createStep({
	id: "create-article",
	description: "Generates an article from subtitles",
	inputSchema: articleWorkflowInputSchema,
	outputSchema: articleWorkflowOutputSchema,
	execute: async ({ inputData, mastra }) => {
		const { subtitles } = inputData

		const agent = mastra?.getAgent("articleAgent")
		if (!agent) {
			throw new Error("Article agent not found")
		}

		const result = await agent.generate(
			[
				{
					role: "user",
					content: `ОБРАБОТАЙ СУБТИТРЫ:
					${subtitles}`,
				},
			],
			{
				structuredOutput: { schema: articleResultSchema },
			}
		)

		return {
			title: result.object.title.trim(),
			description: result.object.description.trim(),
			article: result.object.article.trim(),
		}
	},
})

const articleWorkflow = createWorkflow({
	id: "article-workflow",
	inputSchema: articleWorkflowInputSchema,
	outputSchema: articleWorkflowOutputSchema,
}).then(createArticle)

articleWorkflow.commit()

export { articleWorkflow }
