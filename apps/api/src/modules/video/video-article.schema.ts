import z from "zod"

export const videoArticleSchema = z.object({
	id: z.uuidv7(),
	videoId: z.uuidv7(),
	title: z.string(),
	article: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
})

export type VideoArticle = z.infer<typeof videoArticleSchema>
