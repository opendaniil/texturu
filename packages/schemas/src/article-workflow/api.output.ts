import { z } from "zod"

export const articleSectionSchema = z.object({
	number: z.number().int().positive(),
	title: z.string().trim().min(1),
	content: z.string().trim().min(1),
})
export type ArticleSection = z.infer<typeof articleSectionSchema>

export const articleWorkflowOutputSchema = z.object({
	title: z.string().describe("Generated article title"),
	description: z.string(),
	globalSummary: z.string(),
	sections: z.array(articleSectionSchema),
	article: z.string(),
})
export type ArticleWorkflowOutput = z.infer<typeof articleWorkflowOutputSchema>
