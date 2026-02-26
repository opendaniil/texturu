import { z } from "zod"
import { videoArticleApiSchema } from "../video-article/api.js"

export const chatRequestSchema = z.object({
	articleId: videoArticleApiSchema.shape.id,
	message: z
		.string()
		.trim()
		.min(1)
		.max(400)
		.describe("User message to articleAgent"),
})
export type ChatRequest = z.infer<typeof chatRequestSchema>

export const chatHistoryQuerySchema = z.object({
	articleId: videoArticleApiSchema.shape.id,
})
export type ChatHistoryQuery = z.infer<typeof chatHistoryQuerySchema>
