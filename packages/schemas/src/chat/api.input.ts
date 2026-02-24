import { z } from "zod"
import { videoSchema } from "../video/domain.js"

export const chatRequestSchema = z.object({
	articleId: videoSchema.shape.id.describe(
		"Article id for chat context (same as video id)"
	),
	message: z
		.string()
		.trim()
		.min(1)
		.max(4000)
		.describe("User message to articleAgent"),
})
export type ChatRequest = z.infer<typeof chatRequestSchema>
