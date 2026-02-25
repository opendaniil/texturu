import { z } from "zod"
import { videoSchema } from "../video/domain"
import { videoInfoApiSchema } from "../video-info/api"
import { videoArticleApiSchema } from "./api"

export const latestVideoArticleSchema = videoArticleApiSchema.pick({
	slug: true,
	title: true,
})
export type LatestVideoArticle = z.infer<typeof latestVideoArticleSchema>

export const latestVideoArticlesResponseSchema = z.object({
	items: z.array(latestVideoArticleSchema),
})
export type LatestVideoArticlesResponse = z.infer<
	typeof latestVideoArticlesResponseSchema
>

export const videoArticleResponseSchema = videoArticleApiSchema.extend({
	info: videoInfoApiSchema,

	source: videoSchema.shape.source,
	externalId: videoSchema.shape.externalId,
})

export type VideoArticleResponse = z.infer<typeof videoArticleResponseSchema>
