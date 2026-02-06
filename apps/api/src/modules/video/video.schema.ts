import z from "zod"

const stringToDate = z.codec(z.iso.datetime(), z.date(), {
	decode: (iso) => new Date(iso),
	encode: (d) => d.toISOString(),
})

const videoMeta = z.object({
	title: z.string(),
})

export const videoSchema = z.object({
	id: z.uuidv7(),

	source: z.enum(["youtube"]),
	externalId: z
		.string()
		.trim()
		.regex(/^[A-Za-z0-9_-]{11}$/, "Неверный videoId"),

	createdAt: stringToDate,
	updatedAt: stringToDate,

	status: z.enum([
		"queued",
		"fetching_captions",
		"no_captions",
		"processing",
		"done",
		"error",
	]),
	statusMessage: z.string(),

	meta: z.union([z.null(), videoMeta]),
})
export type Video = z.infer<typeof videoSchema>
