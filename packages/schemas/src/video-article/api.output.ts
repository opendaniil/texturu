import type { z } from "zod"
import { videoSchema } from "../video/domain"
import { videoInfoApiSchema } from "../video-info/api"
import { videoArticleApiSchema } from "./api"

export const videoArticleResponseSchema = videoArticleApiSchema.extend({
	info: videoInfoApiSchema,

	source: videoSchema.shape.source,
	externalId: videoSchema.shape.externalId,
})

export type VideoArticleResponse = z.infer<typeof videoArticleResponseSchema>
