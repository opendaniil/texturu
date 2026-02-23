import { openrouter } from "@openrouter/ai-sdk-provider"

export const DIMENSION_E5 = 1024

export const intfloatMultilingualE5 = () =>
	openrouter.textEmbeddingModel("intfloat/multilingual-e5-large", {
		provider: {
			sort: "price",
		},
	})
