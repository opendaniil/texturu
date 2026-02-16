import z from "zod"
import { videoSchema } from "./domain"

export const videoApiSchema = videoSchema.extend({
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
})
