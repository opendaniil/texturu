import type { VideoArticle } from "@tubebook/schemas"

export const revalidate = 10
const apiHost = process.env.API_INTERNAL_HOST

export async function getArticle(
	videoId: string
): Promise<VideoArticle | null> {
	const response = await fetch(`${apiHost}/api/video/${videoId}/article`, {
		method: "GET",
		headers: { Accept: "application/json" },
		next: {
			revalidate,
			tags: [`article:${videoId}`],
		},
	})

	if (response.status === 404) return null

	const body = await response.json().catch(() => null)

	if (!response.ok) {
		throw new Error(body?.message ?? `HTTP ${response.status}`)
	}

	return body
}
