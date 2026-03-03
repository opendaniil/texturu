import type { CoreMessage } from "@mastra/core/llm"
import type { InputProcessor } from "@mastra/core/processors"
import type { RequestContext } from "@mastra/core/request-context"
import type { QueryResult } from "@mastra/core/vector"
import type { MDocument } from "@mastra/rag"
import type { ChatRequestContext } from "@texturu/schemas"
import { embedMany } from "ai"
import { intfloatMultilingualE5 } from "../models/multilingual-e5-large"
import { postgresVector } from "./pg"

export type Chunk = Awaited<ReturnType<MDocument["chunk"]>>[number]

export async function ingestSubtitles(videoId: string, chunks: Chunk[]) {
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
}

export async function retrieveSubtitles(videoId: string, query: string) {
	const {
		embeddings: [queryVector],
	} = await embedMany({
		model: intfloatMultilingualE5(),
		values: [`query: ${query}`],
	})

	const results = await postgresVector.query({
		indexName: "subtitles",
		queryVector,
		topK: 2,
		filter: { videoId },
		minScore: 0.78,
	})

	return results
}

export const injectRequestContext: InputProcessor = {
	id: "inject-request-context",

	async processInput({ messages, systemMessages, requestContext }) {
		const rc = requestContext as RequestContext<ChatRequestContext>
		const videoId = rc.get("articleId")

		const lastUserMessage = [...messages]
			.reverse()
			.find((message) => message.role === "user")
		const userMessage = lastUserMessage?.content?.content
		if (!userMessage) return { messages, systemMessages }

		const queryResult = await retrieveSubtitles(videoId, userMessage)
		if (queryResult.length === 0) {
			return { messages, systemMessages }
		}

		const chunkTexts = queryResult.map(
			(result: QueryResult): string => result?.metadata?.text
		)

		const message: CoreMessage = {
			role: "system",
			content: `
[KB_CONTEXT_START]
${chunkTexts.join("\n\n")}
[KB_CONTEXT_END]
`,
		}

		return {
			messages,
			systemMessages: [...systemMessages, message],
		}
	},
}
