import type { QueryFunction } from "@tanstack/react-query"

const apiHost = process.env.NEXT_PUBLIC_API_HOST

export const statusPoll: QueryFunction<any, ["smart-poll", string]> = async ({
	queryKey,
	signal,
}) => {
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

	return body
}
