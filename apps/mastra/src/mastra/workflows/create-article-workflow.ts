import { createStep, createWorkflow } from "@mastra/core/workflows"
import { MDocument } from "@mastra/rag"
import {
	articleWorkflowInputSchema,
	articleWorkflowOutputSchema,
} from "@tubebook/schemas"
import z from "zod"
import { ingestSubtitles } from "../store/subtitles"

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
		let subtitles = inputData.subtitles

		const lenLimit = 10000
		if (subtitles.length > lenLimit) {
			subtitles = subtitles.slice(0, lenLimit)
		}

		const agent = mastra?.getAgent("createArticleAgent")
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

const embedArticle = createStep({
	id: "embed-article",
	description: "Embeds an subtitle into a markdown file",
	inputSchema: articleWorkflowInputSchema,
	outputSchema: z.void(),
	execute: async ({ inputData }) => {
		const { videoId, subtitles } = inputData

		const doc = MDocument.fromText(subtitles)

		const chunks = await doc.chunk({
			strategy: "token",
			maxSize: 512,
			overlap: 50,
		})

		await ingestSubtitles(videoId, chunks)

		return
	},
})

const pickArticle = createStep({
	id: "pick-article",
	inputSchema: z.object({
		"create-article": articleWorkflowOutputSchema,
		"embed-article": z.void(),
	}),
	outputSchema: articleWorkflowOutputSchema,
	execute: async ({ inputData }) => inputData["create-article"],
})

const createArticleWorkflow = createWorkflow({
	id: "article-workflow",
	inputSchema: articleWorkflowInputSchema,
	outputSchema: articleWorkflowOutputSchema,
})
	.parallel([createArticle, embedArticle])
	.then(pickArticle)

createArticleWorkflow.commit()

export { createArticleWorkflow }
