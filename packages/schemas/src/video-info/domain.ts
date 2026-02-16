import z from "zod"
import { stringToDateCodec } from "../utils"
import { videoSchema } from "../video/domain"

export const videoInfoSchema = z.object({
	id: z.uuidv7(),
	videoId: videoSchema.shape.id,
	fulltitle: z.string().nullable(),
	description: z.string().nullable(),
	channelId: z.string().nullable(),
	channelTitle: z.string().nullable(),
	duration: z.number().int().nonnegative().nullable(),
	categories: z.array(z.string()),
	tags: z.array(z.string()),
	language: z.string().nullable(),
	createdAt: stringToDateCodec,
	updatedAt: stringToDateCodec,
})
export type VideoInfo = z.infer<typeof videoInfoSchema>
