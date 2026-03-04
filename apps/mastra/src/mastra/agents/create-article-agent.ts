import { Agent } from "@mastra/core/agent"
import { Memory } from "@mastra/memory"
import { gptOss120 } from "../models/gpt-oss-120b"

export const createArticleAgent = new Agent({
	id: "create-article-agent",
	name: "Article Agent",
	model: gptOss120({ temperature: 0 }),
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
	instructions: ``,
})
