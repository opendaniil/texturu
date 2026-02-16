import { z } from "zod"

export const articleWorkflowOutputSchema = z.object({
	title: z.string().describe("Generated article title"),
	article: z.string().describe("Generated MD article"),
})
export type ArticleWorkflowOutput = z.infer<typeof articleWorkflowOutputSchema>
