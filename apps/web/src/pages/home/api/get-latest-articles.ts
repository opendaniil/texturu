import {
	type LatestVideoArticlesQuery,
	type LatestVideoArticlesResponse,
	latestVideoArticlesQuerySchema,
	latestVideoArticlesResponseSchema,
} from "@tubebook/schemas"
import { apiClient } from "@/shared/lib/api-client.ts"

export async function getLatestArticles(
	signal?: AbortSignal
): Promise<LatestVideoArticlesResponse> {
	const query = latestVideoArticlesQuerySchema.parse({
		limit: 100,
	} satisfies LatestVideoArticlesQuery)
	const searchParams = new URLSearchParams({
		limit: String(query.limit),
	})

	const body = await apiClient<LatestVideoArticlesResponse>(
		`/api/video/articles/latest?${searchParams.toString()}`,
		{
			method: "GET",
			signal,
			headers: { Accept: "application/json" },
		}
	)

	return latestVideoArticlesResponseSchema.parse(body)
}
