import { z } from "zod"

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/

export const videoExternalIdSchema = z
	.string()
	.trim()
	.regex(VIDEO_ID_RE, "Неверный videoId")

export const videoStatusProgressOrder = [
	"queued",
	"fetching_info",
	"fetching_captions",
	"generating_article",
	"done",
] as const

const videoStatusValues = [...videoStatusProgressOrder, "error"] as const

export const videoStatusSchema = z.enum(videoStatusValues)

export const videoSchema = z.object({
	id: z.uuidv7(),

	source: z.enum(["youtube"]),
	externalId: videoExternalIdSchema,
	status: videoStatusSchema,
	statusMessage: z.string(),

	createdAt: z.date(),
	updatedAt: z.date(),
})
export type Video = z.infer<typeof videoSchema>
