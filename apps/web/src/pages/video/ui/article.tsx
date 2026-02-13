"use client"

import { useVideoArticle } from "../model"

type Params = {
	videoId: string
}

export function Article({ videoId }: Params) {
	const { data, isLoading, isFetching, isError, error } =
		useVideoArticle(videoId)

	if (isLoading) {
		return (
			<div className="h-screen w-full flex items-center justify-center">
				Загружаю статью...
			</div>
		)
	}

	if (isError) {
		return (
			<div className="h-screen w-full flex flex-col items-center justify-center gap-2">
				<div>Не удалось загрузить статью</div>
				<div className="text-sm text-red-600">{error.message}</div>
			</div>
		)
	}

	return (
		<article className="min-h-screen w-full max-w-3xl mx-auto px-4 py-8 space-y-4">
			{data?.title && <h1 className="text-3xl font-semibold">{data.title}</h1>}
			<pre className="whitespace-pre-wrap break-words">{data?.article}</pre>
			{isFetching && (
				<div className="text-sm text-muted-foreground">Обновляю...</div>
			)}
		</article>
	)
}
