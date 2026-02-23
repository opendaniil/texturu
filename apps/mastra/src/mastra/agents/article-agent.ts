import { Agent } from "@mastra/core/agent"
import { Memory } from "@mastra/memory"
import { gptOss120 } from "../models/gpt-oss-120b"
import { postgres } from "../store/pg"
import { injectRequestContext } from "../store/subtitles"

export const articleAgent = new Agent({
	id: "article-agent",
	name: "Article Agent",
	model: gptOss120({ temperature: 0, max_tokens: 300 }, { effort: "low" }),
	tools: {},
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
	instructions: `
Ты помощник.

Отвечай кратко и лаконично, если тема требует, то отвечай подробно и вдумчиво.

Используй KB_CONTEXT как источник фактов; если ответа там нет — скажи, что в базе нет прямого ответа.
`,
})
