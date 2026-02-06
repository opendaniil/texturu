import type { QueryFunction } from "@tanstack/react-query"
import {
	type VideoStatusResponse,
	videoStatusResponseSchema,
} from "@tubebook/schemas"

const apiHost = process.env.NEXT_PUBLIC_API_HOST

export const statusPoll: QueryFunction<
	VideoStatusResponse,
	["smart-poll", string]
> = async ({ queryKey, signal }) => {
	const [, videoId] = queryKey

	const r = await fetch(`${apiHost}/api/video/${videoId}/status`, {
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
