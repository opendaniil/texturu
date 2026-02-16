import { z } from "zod"

export const articleWorkflowInputSchema = z.object({
	subtitles: z.string().describe("Video subtitles"),
})
export type ArticleWorkflowInput = z.infer<typeof articleWorkflowInputSchema>
