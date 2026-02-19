import { Agent } from "@mastra/core/agent"
import { Memory } from "@mastra/memory"
import { gptOss120 } from "../models/gpt-oss-120b"

export const articleAgent = new Agent({
	id: "article-agent",
	name: "Article Agent",
	model: gptOss120({ temperature: 0, max_tokens: 0 }),
	tools: {},
	memory: new Memory({
		options: {
			lastMessages: false,
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
