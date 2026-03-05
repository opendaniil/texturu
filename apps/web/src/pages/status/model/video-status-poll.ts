import { useQuery } from "@tanstack/react-query"
import {
	type Video,
	type VideoStatusResponse,
	videoStatusProgressOrder,
} from "@texturu/schemas"
import { ApiClientError } from "@/shared/lib/api-client"
import { statusPoll } from "../api/status-poll"

const TOTAL_STEPS = videoStatusProgressOrder.length

const TITLE_SUFFIX = "| Texturu App"

export function formatStatusTitle(data: VideoStatusResponse): string | null {
	const idx = videoStatusProgressOrder.indexOf(data.status as never)
	if (idx === -1) return null
	return `(${idx + 1}/${TOTAL_STEPS}) ${data.statusMessage} ${TITLE_SUFFIX}`
}

const POLL_INTERVAL = 5_000

function isNotFoundError(error: unknown): boolean {
	return error instanceof ApiClientError && error.status === 404
}

export function useVideoStatusPoll(videoId?: Video["id"]) {
	return useQuery<
		VideoStatusResponse,
		Error,
		VideoStatusResponse,
		["smart-poll", Video["id"]]
	>({
		queryKey: ["smart-poll", videoId ?? ""],
		enabled: !!videoId,
		queryFn: statusPoll,
		retry: false,
		refetchInterval: (query) => {
			const data = query.state.data

			if (data?.isFinal === true) return 0
			if (!data && !query.state.error) return 0

			if (isNotFoundError(query.state.error)) return false

			return POLL_INTERVAL
		},
	})
}
