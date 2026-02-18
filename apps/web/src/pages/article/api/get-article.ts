import type { VideoArticleResponse } from "@tubebook/schemas"
import { ApiClientError, apiClient } from "@/shared/lib/api-client.ts"

export const revalidate = 10

export async function getArticle(
	videoId: string
): Promise<VideoArticleResponse | null> {
	try {
		return await apiClient<VideoArticleResponse>(
			`/api/video/${videoId}/article`,
			{
				method: "GET",
				headers: { Accept: "application/json" },
				next: {
					revalidate,
					tags: [`article:${videoId}`],
				},
			}
		)
	} catch (error) {
		if (error instanceof ApiClientError && error.status === 404) {
			return null
		}
		throw error
	}
}
