import { createStep, createWorkflow } from "@mastra/core/workflows"
import { MDocument } from "@mastra/rag"
import {
	type ArticleWorkflowInput,
	articleWorkflowInputSchema,
	articleWorkflowOutputSchema,
} from "@texturu/schemas"
import { generateText } from "ai"
import z from "zod"
import { llama318binstruct } from "../models/llama-3.1-8b-instruct"
import { ingestSubtitles } from "../store/subtitles"
import { extractSectionsFromArticle } from "./article-sections.helper"

const finalArticleDraftSchema = z.object({
	title: z.string().trim().min(1).describe("Заголовок статьи"),
	description: z
		.string()
		.trim()
		.min(1)
		.describe("SEO meta description, 1-2 предложения"),
	globalSummary: z
		.string()
		.trim()
		.min(1)
		.describe("Краткий пересказ для карточки, 2-3 предложения"),
	article: z.string().trim().min(1).describe("Полный текст статьи в markdown"),
})

const summariesSchema = z.object({
	summaries: z.array(z.string()),
})

const summarizeChunks = createStep({
	id: "summarize-chunks",
	description: "Splits subtitles into chunks and summarizes each one",
	inputSchema: articleWorkflowInputSchema,
	outputSchema: summariesSchema,
	retries: 3,
	execute: async ({ inputData }) => {
		const subtitles = inputData.subtitles.trim()
		if (subtitles.length === 0) {
			throw new Error("Subtitles are empty")
		}

		const doc = MDocument.fromText(subtitles)
		const chunks = await doc.chunk({
			strategy: "token",
			maxSize: 1_000,
			overlap: 200,
		})

		const chunkTexts = chunks
			.map((chunk) => chunk.text.trim())
			.filter((text) => text.length > 0)
		if (chunkTexts.length === 0) {
			throw new Error("Chunking produced no non-empty chunks")
		}

		const summaries = await Promise.all(
			chunkTexts.map(async (chunkText, index) => {
				const { text } = await generateText({
					model: llama318binstruct(),

					system: `
	Ваша задача — дать краткое и фактическое изложение данного отрывка.

	Правила:
	- Ваш ответ должен быть на русском языке.
	- Подведите итог, используя только информацию из данного отрывка. Не делайте выводов. Не используйте свои внутренние знания. 
	- Не вводите преамбулу или пояснение, выведите только краткое содержание.`,

					prompt: `
	CHUNK_INDEX: ${index + 1}
	SUBTITLES_CHUNK:
	${chunkText}`,
				})

				return text
			})
		)

		return { summaries }
	},
})

const generateArticle = createStep({
	id: "generate-article",
	description: "Generates final article from chunk summaries",
	inputSchema: summariesSchema,
	outputSchema: articleWorkflowOutputSchema,
	retries: 3,
	execute: async ({ inputData, mastra }) => {
		const agent = mastra?.getAgent("createArticleAgent")
		if (!agent) {
			throw new Error("Article agent not found")
		}

		const finalArticleDraft = await agent.generate(
			[
				{
					role: "user",
					content: `
	MAP_SUMMARIES_JSON:
	${JSON.stringify(inputData.summaries)}`,
				},
			],
			{
				system: `
	Синтезируй единую связную статью по summaries чанков и верни структурированный результат.

	Требования:
	- Вывод должен быть на русском языке
	- Пиши как статью
	- В article используй секции через заголовки H2 (##)
	- В article не добавляй H1 (#), потому что title хранится отдельно
	- Последняя секция в article должна быть "## Вывод"`,

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

const createArticleWorkflow = createWorkflow({
	id: "article-workflow",
	inputSchema: articleWorkflowInputSchema,
	outputSchema: articleWorkflowOutputSchema,
})
	.then(summarizeChunks)
	.then(generateArticle)
	.map(async ({ getInitData }) => {
		const { subtitles, videoId } = getInitData<ArticleWorkflowInput>()
		return { subtitles, videoId }
	})
	.then(embedSubtitles)
	.map(async ({ getStepResult }) => {
		return getStepResult("generate-article")
	})

createArticleWorkflow.commit()

export { createArticleWorkflow }
