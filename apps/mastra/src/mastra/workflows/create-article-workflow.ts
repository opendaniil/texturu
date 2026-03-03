import { createStep, createWorkflow } from "@mastra/core/workflows"
import { MDocument } from "@mastra/rag"
import {
	articleWorkflowInputSchema,
	articleWorkflowOutputSchema,
} from "@texturu/schemas"
import z from "zod"
import { ingestSubtitles } from "../store/subtitles"
import { extractSectionsFromArticle } from "./article-sections.helper"

const chunkSummarySchema = z.object({
	summary: z.string().trim().min(1),
})

const finalArticleDraftSchema = z.object({
	title: z.string().trim().min(1),
	description: z.string().trim().min(1),
	globalSummary: z.string().trim().min(1),
	article: z.string().trim().min(1),
})

const createArticle = createStep({
	id: "create-article",
	description: "Generates an article from subtitles via chunk summaries",
	inputSchema: articleWorkflowInputSchema,
	outputSchema: articleWorkflowOutputSchema,
	execute: async ({ inputData, mastra }) => {
		const subtitles = inputData.subtitles.trim()
		if (subtitles.length === 0) {
			throw new Error("Subtitles are empty")
		}

		const agent = mastra?.getAgent("createArticleAgent")
		if (!agent) {
			throw new Error("Article agent not found")
		}

		const doc = MDocument.fromText(subtitles)
		const chunks = await doc.chunk({
			strategy: "token",
			maxSize: 16_000,
			overlap: 500,
		})

		const chunkTexts = chunks
			.map((chunk) => chunk.text.trim())
			.filter((text) => text.length > 0)
		if (chunkTexts.length === 0) {
			throw new Error("Chunking produced no non-empty chunks")
		}

		const mapSummaries = await Promise.all(
			chunkTexts.map(async (chunkText, index) => {
				const mapResult = await agent.generate(
					[
						{
							role: "user",
							content: `
	Сделай подробное summary чанка субтитров.

	Требования:
	- Пиши на русском.
	- Summary должен быть ёмким: сохраняй факты, аргументы, детали и примеры.
	- Удали шум, повторы и бессмысленные фрагменты.
	- Сохрани фактический смысл и ход мысли автора.

	CHUNK_INDEX: ${index + 1}
	SUBTITLES_CHUNK:
	${chunkText}`,
						},
					],
					{
						structuredOutput: { schema: chunkSummarySchema },
					}
				)

				return mapResult.object.summary
			})
		)

		const finalArticleDraft = await agent.generate(
			[
				{
					role: "user",
					content: `
	Создай финальную markdown-статью по summaries чанков и верни структурированный результат.

	Требования:
	- Язык ответа: русский.
	- Верни поля: title, description, globalSummary, article.
	- article должен быть в markdown.
	- В article используй секции через заголовки H2 (##).
	- В article не добавляй H1 (#), потому что title хранится отдельно.
	- Последняя секция в article должна быть "## Вывод".
	- Текст должен быть живым и интересным, без сухой канцелярщины.

	MAP_SUMMARIES_JSON:
	${JSON.stringify(mapSummaries)}`,
				},
			],
			{
				structuredOutput: { schema: finalArticleDraftSchema },
			}
		)

		const {
			title,
			description,
			globalSummary,
			article: draftArticle,
		} = finalArticleDraft.object
		const article = draftArticle.trim()
		const sections = extractSectionsFromArticle(article)

		return {
			title: title.trim(),
			description: description.trim(),
			globalSummary: globalSummary.trim(),
			sections,
			article,
		}
	},
})

const embedSubtitles = createStep({
	id: "embed-subtitles",
	description: "Embeds subtitles into vector index for retrieval",
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
		"embed-subtitles": z.void(),
	}),
	outputSchema: articleWorkflowOutputSchema,
	execute: async ({ inputData }) => inputData["create-article"],
})

const createArticleWorkflow = createWorkflow({
	id: "article-workflow",
	inputSchema: articleWorkflowInputSchema,
	outputSchema: articleWorkflowOutputSchema,
})
	.parallel([createArticle, embedSubtitles])
	.then(pickArticle)

createArticleWorkflow.commit()

export { createArticleWorkflow }
