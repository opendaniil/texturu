import { z } from "zod"
import { videoSchema } from "../video/domain"

export const articleWorkflowInputSchema = z.object({
	videoId: videoSchema.shape.id,
	subtitles: z.string().describe("Video subtitles"),
})
export type ArticleWorkflowInput = z.infer<typeof articleWorkflowInputSchema>
