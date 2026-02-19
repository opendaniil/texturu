import {
	type ChatRequest,
	type ChatResponse,
	chatRequestSchema,
	chatResponseSchema,
} from "@tubebook/schemas"
import { apiClient } from "@/shared/lib/api-client.ts"

type Params = ChatRequest

export async function sendChatMessage(params: Params): Promise<ChatResponse> {
	const payload = chatRequestSchema.parse(params)

	const body = await apiClient<ChatResponse>("/api/chat", {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
		cache: "no-store",
	})

	return chatResponseSchema.parse(body)
}
