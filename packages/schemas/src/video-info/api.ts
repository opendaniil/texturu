import z from "zod"
import { videoInfoSchema } from "./domain"

export const videoInfoApiSchema = videoInfoSchema.extend({
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
})
