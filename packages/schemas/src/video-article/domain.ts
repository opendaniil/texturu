import { z } from "zod"
import { videoSchema } from "../video/domain.js"

export const videoArticleSchema = z.object({
	id: z.uuidv7(),

	videoId: videoSchema.shape.id,
	slug: z.string().trim().min(1),
	title: z.string(),
	description: z.string(),
	article: z.string(),

	createdAt: z.date(),
	updatedAt: z.date(),
})
export type VideoArticle = z.infer<typeof videoArticleSchema>
