import { Agent } from "@mastra/core/agent"
import { TokenLimiterProcessor } from "@mastra/core/processors"
import { Memory } from "@mastra/memory"
import { chatRequestContextSchema } from "@texturu/schemas"
import { gptOss120 } from "../models/gpt-oss-120b"
import { postgres } from "../store/pg"
import { injectRequestContext } from "../store/subtitles"
import { getSectionTool } from "../tools/get-section"

export const articleAgent = new Agent({
	id: "article-agent",
	name: "Article Agent",
	model: gptOss120({ temperature: 0, max_tokens: 300 }, { effort: "low" }),
	tools: { getSection: getSectionTool },
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

	inputProcessors: [
		new TokenLimiterProcessor({ limit: 16_000 }),
		injectRequestContext,
	],
	instructions: async ({ requestContext }) => {
		const {
			articleTitle,
			articleDescription,
			articleSummary,
			articleSectionsToc,
			articleUploadedBy,
			articleUploadedAt,
		} = requestContext.toJSON()

		return `
Ты помощник по статье.
Отвечай кратко и лаконично 2-5 предложений.

Используй поля ARTICLE_* и KB_CONTEXT как источник фактов.

Правила:
- На обзорные вопросы опирайся на ARTICLE_SUMMARY.
- На вопросы по конкретному разделу используй tool getSection c sectionNumber из ARTICLE_TOC.
- На точечные детали используй KB_CONTEXT.
- Если ответа в источниках нет, честно скажи, что не нашёл.

ARTICLE_TITLE: ${articleTitle}
ARTICLE_DESCRIPTION: ${articleDescription}
ARTICLE_SUMMARY: ${articleSummary}
ARTICLE_TOC:
${articleSectionsToc}
ARTICLE_UPLOADED_BY: ${articleUploadedBy}
ARTICLE_UPLOADED_AT: ${articleUploadedAt}
`
	},
})
