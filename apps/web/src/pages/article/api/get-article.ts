import type { VideoArticleResponse } from "@tubebook/schemas"
import { ApiClientError, apiClient } from "@/shared/lib/api-client.ts"

export const revalidate = 10

export async function getArticle(
	slug: string
): Promise<VideoArticleResponse | null> {
	try {
		return await apiClient<VideoArticleResponse>(
			`/api/video/articles/${slug}`,
			{
				method: "GET",
				headers: { Accept: "application/json" },
				next: {
					revalidate,
					tags: [`article:${slug}`],
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
