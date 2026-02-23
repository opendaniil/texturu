import { createStep, createWorkflow } from "@mastra/core/workflows"
import { MDocument } from "@mastra/rag"
import {
	articleWorkflowInputSchema,
	articleWorkflowOutputSchema,
} from "@tubebook/schemas"
import { embedMany } from "ai"
import z from "zod"
import { intfloatMultilingualE5 } from "../models/multilingual-e5-large"
import { postgresVector } from "../store/pg"

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

		const { embeddings } = await embedMany({
			model: intfloatMultilingualE5(),
			values: chunks.map((c) => `passage: ${c.text}`),
		})

		await postgresVector.upsert({
			indexName: "subtitles",
			vectors: embeddings,
			ids: chunks.map((_, i) => `${videoId}:${i}`),
			metadata: chunks.map((c, i) => ({
				videoId,
				chunkIndex: i,
				text: c.text,
				source: "subtitles",
			})),
			deleteFilter: { videoId },
		})

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
