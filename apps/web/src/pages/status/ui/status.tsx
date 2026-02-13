"use client"

import { useRouter } from "next/navigation"
import { useVideoStatusPoll } from "../model/video-status-poll"

export function Status({ slug }: { slug: string }) {
	const router = useRouter()
	const { data, isLoading, isFetching, isError, error } =
		useVideoStatusPoll(slug)

	if (data?.isFinal) {
		router.replace(`/article/${slug}`)
	}

	const statusLabel = isError
		? "error"
		: isLoading
			? "loading"
			: (data?.status ?? "unknown")

	return (
		<div className="h-screen w-full flex flex-col items-center justify-center">
			{data?.externalId && (
				<iframe
					src={`https://www.youtube-nocookie.com/embed/${data.externalId}?rel=0`}
					title="video"
				></iframe>
			)}

			<div>Video: {slug}</div>
			<div>Status: {statusLabel}</div>
			<div>Status message: {data?.statusMessage}</div>
			{isFetching && !isLoading && <div>Refreshing status...</div>}
			{isError && <div>{error.message}</div>}
		</div>
	)
}
