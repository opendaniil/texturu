import {
	type CreateVideoRequest,
	type CreateVideoResponse,
	createVideoRequestSchema,
} from "@texturu/schemas"
import { apiClient } from "@/shared/lib/api-client.ts"

type Params = CreateVideoRequest

export const addVideo = async ({ source = "youtube", externalId }: Params) => {
	const payload = createVideoRequestSchema.parse({ source, externalId })

	const body = await apiClient<CreateVideoResponse>("/api/video", {
		method: "POST",
		headers: { Accept: "application/json", "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	})

	return body
}
