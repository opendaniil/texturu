import { z } from "zod"
import { videoApiSchema } from "./api.js"
import { videoSchema } from "./domain.js"

export const createVideoRequestSchema = videoApiSchema.pick({
	source: true,
	externalId: true,
})
export type CreateVideoRequest = z.infer<typeof createVideoRequestSchema>

export const listVideosSortBySchema = z.enum([
	"updatedAt",
	"createdAt",
	"externalId",
	"status",
	"fulltitle",
	"channelTitle",
])
export type ListVideosSortBy = z.infer<typeof listVideosSortBySchema>

export const listVideosQuerySchema = z.object({
	pageIndex: z.coerce.number().int().min(0).default(0),
	pageSize: z.coerce.number().int().min(1).max(100).default(20),
	sortBy: listVideosSortBySchema.default("updatedAt"),
	sortDir: z.enum(["asc", "desc"]).default("desc"),
	status: videoSchema.shape.status.optional(),
	q: z.string().trim().max(200).optional(),
})
export type ListVideosQuery = z.infer<typeof listVideosQuerySchema>
