import {
	type CreateVideoRequest,
	type CreateVideoResponse,
	createVideoRequestSchema,
	createVideoResponseSchema,
} from "@tubebook/schemas"

const apiHost = process.env.NEXT_PUBLIC_API_HOST

type Params = CreateVideoRequest

export const addVideo = async ({
	source = "youtube",
	externalId,
}: Params): Promise<CreateVideoResponse> => {
	const payload = createVideoRequestSchema.parse({ source, externalId })

	const r = await fetch(`${apiHost}/api/video`, {
		method: "POST",
		headers: { Accept: "application/json", "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	})
	const body = await r.json().catch(() => null)

	if (!r.ok) {
		throw Object.assign(new Error(body?.message ?? `HTTP ${r.status}`), {
			status: r.status,
			body,
		})
	}

	return createVideoResponseSchema.parse(body)
}
