import { z } from "zod"

export const chatRequestContextSchema = z.object({
	articleId: z.string().trim().min(1),
	articleTitle: z.string().trim().min(1),
	articleDescription: z.string().trim().min(1),
	articleSummary: z.string().trim().min(1),
	articleSectionsToc: z.string().trim().min(1),
	articleUploadedBy: z.string().trim().min(1),
	articleUploadedAt: z.string().trim().min(1),
})

export type ChatRequestContext = z.infer<typeof chatRequestContextSchema>
