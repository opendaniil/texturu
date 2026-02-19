import { z } from "zod"

export const chatResponseSchema = z.object({
	message: z.string().trim().min(1).describe("Assistant response from articleAgent"),
})
export type ChatResponse = z.infer<typeof chatResponseSchema>
