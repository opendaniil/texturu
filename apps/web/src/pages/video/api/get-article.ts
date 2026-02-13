import type { QueryFunction } from "@tanstack/react-query"
import {
	type Video,
	type VideoArticleResponse,
	videoArticleResponseSchema,
	videoSchema,
} from "@tubebook/schemas"

const apiHost = process.env.NEXT_PUBLIC_API_HOST
const articleParamsSchema = videoSchema.pick({ id: true })

export const getArticle: QueryFunction<
	VideoArticleResponse,
	["video-article", Video["id"]]
> = async ({ queryKey, signal }) => {
	const [, videoId] = queryKey
	const params = articleParamsSchema.parse({ id: videoId })

	const r = await fetch(`${apiHost}/api/video/${params.id}/article`, {
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

	return videoArticleResponseSchema.parse(body)
}

export type { VideoArticleResponse }
