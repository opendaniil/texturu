import type { QueryFunction } from "@tanstack/react-query"
import {
	type Video,
	type VideoStatusResponse,
	videoSchema,
	videoStatusResponseSchema,
} from "@texturu/schemas"
import { apiClient } from "@/shared/lib/api-client.ts"

const statusPollParamsSchema = videoSchema.pick({ id: true })

export async function fetchVideoStatus(
	videoId: Video["id"],
	signal?: AbortSignal
) {
	const params = statusPollParamsSchema.parse({ id: videoId })

	const body = await apiClient(`/api/video/${params.id}/status`, {
		method: "GET",
		signal,
		headers: { Accept: "application/json" },
	})

	return videoStatusResponseSchema.parse(body)
}

export const statusPoll: QueryFunction<
	VideoStatusResponse,
	["smart-poll", Video["id"]]
> = async ({ queryKey, signal }) => {
	const [, videoId] = queryKey

	return fetchVideoStatus(videoId, signal)
}
