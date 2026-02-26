import { z } from "zod"

export const chatHistoryPartSchema = z.object({
	type: z.string().trim().min(1),
})
export type ChatHistoryPart = z.infer<typeof chatHistoryPartSchema>

export const chatHistoryMessageSchema = z.object({
	id: z.string().trim().min(1),
	role: z.enum(["user", "assistant", "system"]),
	parts: z.array(chatHistoryPartSchema),
})
export type ChatHistoryMessage = z.infer<typeof chatHistoryMessageSchema>

export const chatHistoryResponseSchema = z.object({
	messages: z.array(chatHistoryMessageSchema),
})
export type ChatHistoryResponse = z.infer<typeof chatHistoryResponseSchema>
