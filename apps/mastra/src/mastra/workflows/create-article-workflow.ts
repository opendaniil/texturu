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

const articleMetadataSchema = z.object({
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
})

const summariesSchema = z.object({
	summaries: z.array(z.string()),
})

const SUMMARIZE_CONCURRENCY = 5

function getChunkConfig(textLength: number) {
	const t = Math.max(0, Math.min(textLength, 100_000))
	const maxSize = Math.round(800 + (t / 100_000) * 5_200)
	const overlap = Math.round(maxSize * 0.15)
	return { maxSize, overlap }
}

async function inBatches<T, R>(
	items: T[],
	batchSize: number,
	fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
	const results: R[] = []
	for (let i = 0; i < items.length; i += batchSize) {
		const batch = items.slice(i, i + batchSize)
		const batchResults = await Promise.all(
			batch.map((item, j) => fn(item, i + j))
		)
		results.push(...batchResults)
		if (i + batchSize < items.length) {
			await new Promise((r) => setTimeout(r, 500))
		}
	}
	return results
}

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

		const { maxSize, overlap } = getChunkConfig(subtitles.length)
		const doc = MDocument.fromText(subtitles)
		const chunks = await doc.chunk({
			strategy: "token",
			maxSize,
			overlap,
		})

		const chunkTexts = chunks
			.map((chunk) => chunk.text.trim())
			.filter((text) => text.length > 0)
		if (chunkTexts.length === 0) {
			throw new Error("Chunking produced no non-empty chunks")
		}

		const summaries = await inBatches(
			chunkTexts,
			SUMMARIZE_CONCURRENCY,
			async (chunkText, index) => {
				const { text } = await generateText({
					model: llama318binstruct(),
					maxRetries: 3,
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
			}
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

		const articleDraft = await agent.generate(
			[
				{
					role: "user",
					content: `MAP_SUMMARIES_JSON:\n${JSON.stringify(inputData.summaries)}`,
				},
			],
			{
				system: `Синтезируй единую связную статью по summaries чанков.

Требования:
- Вывод должен быть на русском языке
- Пиши как статью
- Используй секции через заголовки H2 (##)
- Не добавляй H1 (#), потому что title хранится отдельно
- Последняя секция должна быть "## Вывод"`,
				modelSettings: { maxRetries: 3 },
			}
		)

		const article = articleDraft.text.trim()

		const metadata = await agent.generate(
			[{ role: "user", content: article }],
			{
				system: `На основе статьи заполни метаданные. Отвечай на русском.`,
				structuredOutput: { schema: articleMetadataSchema },
				modelSettings: { maxRetries: 5 },
			}
		)

		const { title, description, globalSummary } = metadata.object
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
