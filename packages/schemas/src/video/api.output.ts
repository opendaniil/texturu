import { z } from "zod"
import { videoInfoApiSchema } from "../video-info/api.js"
import { videoApiSchema } from "./api.js"

export const createVideoResponseSchema = videoApiSchema
	.omit({ createdAt: true, updatedAt: true })
	.extend({
		redirectTo: z.string(),
		isNew: z.boolean(),
	})
export type CreateVideoResponse = z.infer<typeof createVideoResponseSchema>

export const videoStatusResponseSchema = videoApiSchema
	.omit({ createdAt: true })
	.extend({
		isFinal: z.boolean(),
	})
export type VideoStatusResponse = z.infer<typeof videoStatusResponseSchema>

export const videoResponseSchema = videoApiSchema.extend({
	info: videoInfoApiSchema.nullable(),
})
export type VideoResponse = z.infer<typeof videoResponseSchema>

export const listVideosResponseSchema = z.object({
	items: z.array(videoResponseSchema),
	rowCount: z.number().int().nonnegative(),
})
export type ListVideosResponse = z.infer<typeof listVideosResponseSchema>
