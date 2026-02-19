import { Agent } from "@mastra/core/agent"
import { Memory } from "@mastra/memory"
import { gptOss120 } from "../models/gpt-oss-120b"
import { postgres } from "../store/pg"

export const articleAgent = new Agent({
	id: "article-agent",
	name: "Article Agent",
	model: gptOss120({ temperature: 0, max_tokens: 0 }),
	tools: {},
	memory: new Memory({
		storage: postgres,
		options: {
			lastMessages: 5,
			generateTitle: false,

			workingMemory: {
				enabled: false,
			},
		},
	}),
	instructions: `
Ты помощник
`,
})
