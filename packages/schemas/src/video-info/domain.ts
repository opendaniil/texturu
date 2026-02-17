import z from "zod"
import { videoSchema } from "../video/domain"

export const videoInfoSchema = z.object({
	id: z.uuidv7(),

	videoId: videoSchema.shape.id,
	fulltitle: z.string(),
	description: z.string(),
	channelId: z.string(),
	channelTitle: z.string(),
	duration: z.number().int().nonnegative(),
	categories: z.array(z.string()),
	tags: z.array(z.string()),
	language: z.string(),
	uploadDate: z.string().describe("YYYYMMDD"),

	createdAt: z.date(),
	updatedAt: z.date(),
})
export type VideoInfo = z.infer<typeof videoInfoSchema>
