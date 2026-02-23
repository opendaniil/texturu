import type { OpenRouterSharedSettings } from "@openrouter/ai-sdk-provider"
import { openrouter } from "./openrouter.provider"

export const gptOss120 = (
	extraBody?: OpenRouterSharedSettings["extraBody"],
	reasoning?: OpenRouterSharedSettings["reasoning"]
) =>
	openrouter("openai/gpt-oss-120b", {
		extraBody: Object.assign(
			{
				temperature: 0.3,
			},
			extraBody
		),
		provider: {
			sort: "price",
		},
		reasoning: Object.assign(
			{
				effort: "high",
				exclude: true,
			},
			reasoning
		),
	})
