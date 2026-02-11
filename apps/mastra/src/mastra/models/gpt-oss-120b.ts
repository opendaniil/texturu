import { openrouter } from "./openrouter.provider"

export const gptOss120 = (extraBody?: object) =>
	openrouter("openai/gpt-oss-120b", {
		extraBody: Object.assign(
			{
				temperature: 0.3,
				max_tokens: 256,
			},
			extraBody
		),
		provider: {
			sort: "price",
		},
		reasoning: {
			effort: "low",
			exclude: true,
		},
	})
