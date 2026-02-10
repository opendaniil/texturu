import z from "zod"

export const videoCaptionSchema = z.object({
	id: z.uuidv7(),
	videoId: z.uuidv7(),
	vttText: z.string(),
	plainText: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
})

export type VideoCaption = z.infer<typeof videoCaptionSchema>
