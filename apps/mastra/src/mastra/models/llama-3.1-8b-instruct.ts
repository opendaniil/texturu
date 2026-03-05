import type { OpenRouterSharedSettings } from "@openrouter/ai-sdk-provider"
import { openrouter } from "./openrouter.provider"

export const llama318binstruct = (
	extraBody?: OpenRouterSharedSettings["extraBody"]
) =>
	openrouter("meta-llama/llama-3.1-8b-instruct", {
		extraBody: Object.assign(
			{
				temperature: 0,
			},
			extraBody
		),
		provider: {
			only: ["groq"],
		},
	})
