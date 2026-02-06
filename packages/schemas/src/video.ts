import { z } from "zod"

const stringToDateCodec = z.codec(z.iso.datetime(), z.date(), {
	decode: (iso) => new Date(iso),
	encode: (d) => d.toISOString(),
})

export const videoMetaSchema = z.object({
	title: z.string(),
})

export const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/
export const videoExternalIdSchema = z
	.string()
	.trim()
	.regex(VIDEO_ID_RE, "Неверный videoId")

export const videoSchema = z.object({
	id: z.uuidv7(),
	source: z.enum(["youtube"]),
	externalId: videoExternalIdSchema,
	createdAt: stringToDateCodec,
	updatedAt: stringToDateCodec,
	status: z.enum([
		"queued",
		"fetching_captions",
		"no_captions",
		"processing",
		"done",
		"error",
	]),
	statusMessage: z.string(),
	meta: z.union([z.null(), videoMetaSchema]),
})
export type Video = z.infer<typeof videoSchema>

export const videoIdParamSchema = videoSchema.pick({ id: true })

export const createVideoRequestSchema = videoSchema.pick({
	source: true,
	externalId: true,
})
export type CreateVideoRequest = z.infer<typeof createVideoRequestSchema>

export const createVideoResponseSchema = videoSchema
	.omit({ createdAt: true, updatedAt: true, meta: true })
	.extend({
		redirectTo: z.string(),
		isNew: z.boolean(),
	})
export type CreateVideoResponse = z.infer<typeof createVideoResponseSchema>

export const videoStatusResponseSchema = videoSchema
	.omit({ createdAt: true, meta: true })
	.extend({
		isFinal: z.boolean(),
	})
