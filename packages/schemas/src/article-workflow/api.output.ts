import { z } from "zod"

export const articleWorkflowOutputSchema = z.object({
	title: z.string().describe("Generated article title"),
	description: z
		.string()
		.describe("Generated detailed article description (2-4 sentences)"),
	article: z.string().describe("Generated MD article"),
})
export type ArticleWorkflowOutput = z.infer<typeof articleWorkflowOutputSchema>
