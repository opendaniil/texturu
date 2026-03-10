import type { OpenRouterSharedSettings } from "@openrouter/ai-sdk-provider"
import { openrouter } from "./openrouter.provider"

export const gptOss120 = (
	extraBody?: OpenRouterSharedSettings["extraBody"],
	reasoning?: OpenRouterSharedSettings["reasoning"]
) =>
	openrouter("openai/gpt-oss-120b", {
		debug: {
			echo_upstream_body: true,
		},
		extraBody: Object.assign(
			{
				temperature: 0.3,
				provider: {
					sort: "price",
					preferred_min_throughput: { p90: 50 },
					preferred_max_latency: { p90: 3 },
				},
			},
			extraBody
		),
		reasoning: Object.assign(
			{
				effort: "high",
				exclude: true,
			},
			reasoning
		),
	})
