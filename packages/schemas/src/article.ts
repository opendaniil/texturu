import z from "zod"
import { stringToDateCodec } from "./utils"
import { videoSchema } from "./video"

export const videoArticleSchema = z.object({
	id: z.uuidv7(),

	videoId: videoSchema.shape.id,

	title: z.string(),
	article: z.string(),

	createdAt: stringToDateCodec,
	updatedAt: stringToDateCodec,
})

export type VideoArticle = z.infer<typeof videoArticleSchema>
