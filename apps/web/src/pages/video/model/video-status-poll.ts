import { useQuery } from "@tanstack/react-query"
import { statusPoll } from "../api"

const POOL_INTERVAL = 5_000

export function useVideoStatusPoll(videoId?: string) {
	return useQuery({
		queryKey: ["smart-poll", videoId ?? ""],
		enabled: !!videoId,
		queryFn: statusPoll,
		retry: false,
		refetchInterval: (query) => {
			if (query.state.status === "error") return false

			const data = query.state.data as any | undefined
			if (!data) return 0

			if (data.isFinal !== true) return POOL_INTERVAL
			return 0
		},
	})
}
