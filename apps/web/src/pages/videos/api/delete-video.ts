import { apiClient } from "@/shared/lib/api-client.ts"

export async function deleteVideo(
	videoId: string,
	adminKey: string
): Promise<void> {
	await apiClient(`/api/video/${videoId}`, {
		method: "DELETE",
		headers: {
			"x-admin-key": adminKey,
		},
	})
}
