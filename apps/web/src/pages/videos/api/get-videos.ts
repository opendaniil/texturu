import {
	type ListVideosQuery,
	type ListVideosResponse,
	listVideosQuerySchema,
} from "@tubebook/schemas"
import { apiClient } from "@/shared/lib/api-client.ts"

export async function getVideos(
	query: ListVideosQuery,
	signal?: AbortSignal
): Promise<ListVideosResponse> {
	const params = listVideosQuerySchema.parse(query)
	const searchParams = new URLSearchParams({
		pageIndex: String(params.pageIndex),
		pageSize: String(params.pageSize),
		sortBy: params.sortBy,
		sortDir: params.sortDir,
	})

	if (params.status) {
		searchParams.set("status", params.status)
	}

	if (params.q) {
		searchParams.set("q", params.q)
	}

	const body = await apiClient<ListVideosResponse>(
		`/api/video?${searchParams.toString()}`,
		{
			method: "GET",
			signal,
			headers: { Accept: "application/json" },
		}
	)

	return body
}
