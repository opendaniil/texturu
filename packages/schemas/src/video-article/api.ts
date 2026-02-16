import z from "zod"
import { videoArticleSchema } from "./domain"

export const videoArticleApiSchema = videoArticleSchema.extend({
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
})
