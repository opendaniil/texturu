import { Agent } from "@mastra/core/agent"
import { Memory } from "@mastra/memory"
import { chatRequestContextSchema } from "@tubebook/schemas"
import { gptOss120 } from "../models/gpt-oss-120b"
import { postgres } from "../store/pg"
import { injectRequestContext } from "../store/subtitles"

function getContextText(value: unknown, fallback: string): string {
	if (typeof value !== "string") {
		return fallback
	}

	const normalized = value.trim()
	return normalized.length > 0 ? normalized : fallback
}

export const articleAgent = new Agent({
	id: "article-agent",
	name: "Article Agent",
	model: gptOss120({ temperature: 0, max_tokens: 300 }, { effort: "low" }),
	tools: {},
	requestContextSchema: chatRequestContextSchema,
	memory: new Memory({
		storage: postgres,
		options: {
			lastMessages: 4,
			generateTitle: false,

			workingMemory: {
				enabled: false,
			},
		},
	}),

	inputProcessors: [injectRequestContext],
	instructions: async ({ requestContext }) => {
		const articleTitle = getContextText(
			requestContext?.get("articleTitle"),
			"null"
		)
		const articleShortDescription = getContextText(
			requestContext?.get("articleShortDescription"),
			"null"
		)
		const articleUploadedBy = getContextText(
			requestContext?.get("articleUploadedBy"),
			"null"
		)
		const articleUploadedAt = getContextText(
			requestContext?.get("articleUploadedAt"),
			"null"
		)

		return `
Ты помощник по статье.
Отвечай кратко и лаконично 2-5 предложений.

Используй поля ARTICLE_* и KB_CONTEXT как источник фактов, если ответа там нет — скажи, что ты не знаешь.

ARTICLE_TITLE: ${articleTitle}
ARTICLE_SHORT_DESCRIPTION: ${articleShortDescription}
ARTICLE_UPLOADED_BY: ${articleUploadedBy}
ARTICLE_UPLOADED_AT: ${articleUploadedAt}
`
	},
})
