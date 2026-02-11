import { openrouter } from "@openrouter/ai-sdk-provider"

export const intfloatMultilingualE5 = () =>
	openrouter.textEmbeddingModel("intfloat/multilingual-e5-large", {
		provider: {
			sort: "price",
		},
	})
