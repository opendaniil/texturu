import {
	type ChatHistoryQuery,
	type ChatHistoryResponse,
	chatHistoryQuerySchema,
} from "@texturu/schemas"
import { apiClient } from "@/shared/lib/api-client"

export async function getChatHistory(
	query: ChatHistoryQuery,
	signal?: AbortSignal
): Promise<ChatHistoryResponse> {
	const params = chatHistoryQuerySchema.parse(query)
	const searchParams = new URLSearchParams({
		articleId: params.articleId,
	})

	return apiClient<ChatHistoryResponse>(
		`/api/chat/history?${searchParams.toString()}`,
		{
			method: "GET",
			signal,
			credentials: "include",
			headers: { Accept: "application/json" },
		}
	)
}
