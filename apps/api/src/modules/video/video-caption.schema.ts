import { videoSchema } from "@tubebook/schemas"
import z from "zod"

export const videoCaptionSchema = z.object({
	id: z.uuidv7(),
	videoId: videoSchema.shape.id,

	vttText: z.string(),
	plainText: z.string(),

	createdAt: z.date(),
	updatedAt: z.date(),
})

export type VideoCaption = z.infer<typeof videoCaptionSchema>
