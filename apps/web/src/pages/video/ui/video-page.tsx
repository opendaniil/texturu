"use client"

import { useVideoStatusPoll } from "../model/video-status-poll"

type Params = {
	slug: string
}

export default function VideoPage({ params }: { params: Params }) {
	const { data, isLoading, isFetching, isError, error } = useVideoStatusPoll(
		params.slug
	)

	return (
		<div className="h-screen w-full flex flex-col items-center justify-center">
			{data?.externalId && (
				<iframe
					src={`https://www.youtube-nocookie.com/embed/${data.externalId}?rel=0`}
					title="video"
				></iframe>
			)}

			<div>Video: {params.slug}</div>

			<pre>
				{JSON.stringify(
					{ data, isLoading, isFetching, isError, error },
					null,
					2
				)}
			</pre>
		</div>
	)
}
