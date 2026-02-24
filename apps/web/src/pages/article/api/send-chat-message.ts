import {
	type ChatRequest,
	type ChatResponse,
	chatRequestSchema,
	chatResponseSchema,
} from "@tubebook/schemas"
import { apiClient } from "@/shared/lib/api-client.ts"

type Params = ChatRequest & {
	signal?: AbortSignal
}

export async function sendChatMessage({
	signal,
	...params
}: Params): Promise<ChatResponse> {
	const payload = chatRequestSchema.parse(params)

	const body = await apiClient<ChatResponse>("/api/chat", {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		credentials: "include",
		body: JSON.stringify(payload),
		cache: "no-store",
		signal,
	})

	return chatResponseSchema.parse(body)
}
