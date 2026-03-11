import { apiClient } from "@/shared/lib/api-client.ts"

export async function regenerateArticle(
	videoId: string,
	adminKey: string
): Promise<void> {
	await apiClient(`/api/video/${videoId}/regenerate-article`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-admin-key": adminKey,
		},
	})
}
