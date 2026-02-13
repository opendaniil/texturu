import { useQuery } from "@tanstack/react-query"
import type { Video } from "@tubebook/schemas"
import { getArticle, type VideoArticleResponse } from "../api"

export function useVideoArticle(videoId?: Video["id"]) {
	return useQuery<
		VideoArticleResponse,
		Error,
		VideoArticleResponse,
		["video-article", Video["id"]]
	>({
		queryKey: ["video-article", videoId ?? ""],
		enabled: !!videoId,
		queryFn: getArticle,
		retry: false,
	})
}
