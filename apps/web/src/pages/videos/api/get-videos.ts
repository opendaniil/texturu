import {
	type ListVideosQuery,
	type ListVideosResponse,
	listVideosQuerySchema,
	listVideosResponseSchema,
} from "@tubebook/schemas"

const apiHost = process.env.NEXT_PUBLIC_API_HOST

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

	const response = await fetch(
		`${apiHost}/api/video?${searchParams.toString()}`,
		{
			method: "GET",
			signal,
			headers: { Accept: "application/json" },
		}
	)
	const body = await response.json().catch(() => null)

	if (!response.ok) {
		throw Object.assign(new Error(body?.message ?? `HTTP ${response.status}`), {
			status: response.status,
			body,
		})
	}

	return listVideosResponseSchema.parse(body)
}
