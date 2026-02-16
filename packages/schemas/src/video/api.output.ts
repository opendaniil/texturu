import { z } from "zod"
import { videoInfoSchema } from "../video-info/domain.js"
import { videoSchema } from "./domain.js"

export const createVideoResponseSchema = videoSchema
	.omit({ createdAt: true, updatedAt: true })
	.extend({
		redirectTo: z.string(),
		isNew: z.boolean(),
	})
export type CreateVideoResponse = z.infer<typeof createVideoResponseSchema>

export const videoStatusResponseSchema = videoSchema
	.omit({ createdAt: true })
	.extend({
		isFinal: z.boolean(),
	})
export type VideoStatusResponse = z.infer<typeof videoStatusResponseSchema>

export const videoResponseSchema = videoSchema.extend({
	info: videoInfoSchema.nullable(),
})
export type VideoResponse = z.infer<typeof videoResponseSchema>
