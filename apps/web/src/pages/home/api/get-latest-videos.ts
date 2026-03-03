import type { ListVideosResponse } from "@texturu/schemas"
import { apiClient } from "@/shared/lib/api-client"

export const revalidate = 30

export interface LatestVideoMarqueeItem {
	id: string
	title: string
	thumbnail: string | null
}

export async function getLatestVideos(): Promise<LatestVideoMarqueeItem[]> {
	const searchParams = new URLSearchParams({
		pageIndex: "0",
		pageSize: "10",
		sortBy: "createdAt",
		sortDir: "desc",
	})

	const response = await apiClient<ListVideosResponse>(
		`/api/video?${searchParams.toString()}`,
		{
			method: "GET",
			headers: { Accept: "application/json" },
			next: {
				revalidate,
				tags: ["home:latest-videos"],
			},
		}
	)

	return response.items.map((item) => ({
		id: item.id,
		title: item.info?.fulltitle ?? item.externalId,
		thumbnail: item.info?.thumbnail ?? null,
	}))
}
