import type { VideoStatusResponse } from "@tubebook/schemas"

type StatusVideoProps = {
	source?: VideoStatusResponse["source"]
	externalId?: string
}

export function StatusVideo({ source, externalId }: StatusVideoProps) {
	if (source !== "youtube" || !externalId) {
		return null
	}

	return (
		<div className="overflow-hidden rounded-xl border bg-card shadow-xs">
			<div className="aspect-video w-full">
				<iframe
					className="h-full w-full min-h-[200px]"
					src={`https://www.youtube-nocookie.com/embed/${externalId}?rel=0`}
					title="video"
					allowFullScreen
				/>
			</div>
		</div>
	)
}
