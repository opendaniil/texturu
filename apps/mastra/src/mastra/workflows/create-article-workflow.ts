import { createStep, createWorkflow } from "@mastra/core/workflows"
import { MDocument } from "@mastra/rag"
import {
	type ArticleWorkflowInput,
	articleWorkflowInputSchema,
	articleWorkflowOutputSchema,
} from "@texturu/schemas"
import { generateText, Output } from "ai"
import z from "zod"
import { gptOss120 } from "../models/gpt-oss-120b"
import { llama318binstruct } from "../models/llama-3.1-8b-instruct"
import { ingestSubtitles } from "../store/subtitles"
import { extractSectionsFromArticle } from "./article-sections.helper"

const articleMetadataSchema = z.object({
	title: z
		.string()
		.trim()
		.min(1)
		.describe("Заголовок статьи для карточки-превью"),
	description: z
		.string()
		.trim()
		.min(1)
		.describe("Описание статьи для поисковиков"),
	globalSummary: z
		.string()
		.trim()
		.min(1)
		.describe("Краткий пересказ статьи для карточки-превью"),
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
	execute: async ({ inputData, mastra }) => {
		const logger = mastra.getLogger()
		const subtitles = inputData.subtitles.trim()
		if (subtitles.length === 0) {
			throw new Error("Subtitles are empty")
		}

		logger.info("summarize-chunks: input", {
			subtitlesLength: subtitles.length,
		})

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

		logger.info("summarize-chunks: chunking done", {
			chunkCount: chunkTexts.length,
			maxSize,
			overlap,
			chunkLengths: chunkTexts.map((t) => t.length),
		})

		const summaries = await inBatches(
			chunkTexts,
			SUMMARIZE_CONCURRENCY,
			async (chunkText, index) => {
				const { text } = await generateText({
					// Почему использую llama 3.1 8b instruct?
					// 5.4 % рейтинг галлюцинаций https://github.com/vectara/hallucination-leaderboard/tree/hhem-2.3-old-dataset
					// 300+ токенов в секунду
					model: llama318binstruct({ max_tokens: maxSize }),
					maxRetries: 3,
					system: `
	You are a summarization bot. You must stick to the information provided solely by the text in the passage.
	Provide a concise summary in Russian, covering the core pieces of information described.
	Preserve all key facts, names, numbers, and dates.
	Do not add any information beyond what is in the passage.
	Do not include preambles or meta-commentary — output only the summary.`,
					prompt: chunkText,
				})

				const ratio = text.length / chunkText.length
				logger.info(`summarize-chunks: chunk ${index} done`, {
					chunkLength: chunkText.length,
					summaryLength: text.length,
					compressionRatio: ratio.toFixed(2),
				})

				return text
			}
		)

		const totalSummariesLength = summaries.reduce(
			(sum, s) => sum + s.length,
			0,
		)
		const totalChunksLength = chunkTexts.reduce(
			(sum, t) => sum + t.length,
			0,
		)

		logger.info("summarize-chunks: all done", {
			chunkCount: chunkTexts.length,
			totalChunksLength,
			totalSummariesLength,
			overallCompressionRatio: (
				totalSummariesLength / totalChunksLength
			).toFixed(2),
		})

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
		const logger = mastra.getLogger()
		const model = gptOss120({ temperature: 0 })

		const numberedSummaries = inputData.summaries
			.map((s, i) => `[${i + 1}] ${s}`)
			.join("\n\n")

		logger.info("generate-article: input", {
			summaryCount: inputData.summaries.length,
			summaryLengths: inputData.summaries.map((s) => s.length),
			totalPromptLength: numberedSummaries.length,
		})

		const articleDraft = await generateText({
			model,
			maxRetries: 2,
			system: `
	Ты — автор информационных статей на русском языке. Твоя задача — написать связную статью из пронумерованных саммари, которые идут в хронологическом порядке.

	Требования к статье:
	- Пиши развёрнутые параграфы, а не списки и таблицы. Тон — нейтральный, информационный.
	- Объединяй повторяющуюся или пересекающуюся информацию из разных саммари — не дублируй.
	- Группируй по темам, а не по порядку саммари.

	Требования к формату:
	- Начинай сразу с первого заголовка H2 (##). Не используй H1 (#) — заголовок хранится отдельно.
	- Заверши статью секцией "## Вывод" с кратким итогом.
	- Выводи только текст статьи в Markdown. Без метаданных, JSON, списков полей или плана.
	- Никаких вопросов к читателю, предложений "что дальше", эмодзи или интерактивных блоков — это статья, а не чат.`,
			prompt: numberedSummaries,
		})

		const article = articleDraft.text.trim()

		const metadata = await generateText({
			model,
			maxRetries: 3,
			output: Output.object({ schema: articleMetadataSchema }),
			system: `
	На основе статьи заполни метаданные.

	Требования:
	- Отвечай на русском языке.
	- title: ёмкий, конкретный заголовок без кликбейта. Отражай главную тему, а не общую категорию.
	- description: 1-2 предложения для SEO — о чём статья и что узнает читатель.
	- globalSummary: 2-3 предложения, передающие ключевые факты статьи. Для карточки-превью.`,
			prompt: article,
		})

		if (!metadata.output) {
			throw new Error("Failed to extract article metadata")
		}

		const { title, description, globalSummary } = metadata.output
		const sections = extractSectionsFromArticle(article)
		if (sections.length === 0) {
			throw new Error("Article has no H2 sections — likely malformed output")
		}

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
