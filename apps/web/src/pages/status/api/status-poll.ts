import type { QueryFunction } from "@tanstack/react-query"
import {
	type Video,
	type VideoStatusResponse,
	videoSchema,
	videoStatusResponseSchema,
} from "@tubebook/schemas"

const apiHost = process.env.NEXT_PUBLIC_API_HOST
const statusPollParamsSchema = videoSchema.pick({ id: true })

export const statusPoll: QueryFunction<
	VideoStatusResponse,
	["smart-poll", Video["id"]]
> = async ({ queryKey, signal }) => {
	const [, videoId] = queryKey
	const params = statusPollParamsSchema.parse({ id: videoId })

	const r = await fetch(`${apiHost}/api/video/${params.id}/status`, {
		method: "GET",
		signal,
		headers: { Accept: "application/json" },
	})
	const body = await r.json().catch(() => null)

	if (!r.ok) {
		throw Object.assign(new Error(body?.message ?? `HTTP ${r.status}`), {
			status: r.status,
			body,
		})
	}

	return videoStatusResponseSchema.parse(body)
}
