import { z } from "zod"
import { stringToDateCodec } from "../utils.js"

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/

export const videoExternalIdSchema = z
	.string()
	.trim()
	.regex(VIDEO_ID_RE, "Неверный videoId")

export const videoInfoPayloadSchema = z.object({
	fulltitle: z.string().nullable(),
	description: z.string().nullable(),
	channelId: z.string().nullable(),
	channelTitle: z.string().nullable(),
	duration: z.number().int().nonnegative().nullable(),
	categories: z.array(z.string()),
	tags: z.array(z.string()),
	language: z.string().nullable(),
})
export type VideoInfoPayload = z.infer<typeof videoInfoPayloadSchema>

export const videoSchema = z.object({
	id: z.uuidv7(),
	source: z.enum(["youtube"]),
	externalId: videoExternalIdSchema,
	createdAt: stringToDateCodec,
	updatedAt: stringToDateCodec,
	status: z.enum(["queued", "processing", "done", "error"]),
	statusMessage: z.string(),
})
export type Video = z.infer<typeof videoSchema>
