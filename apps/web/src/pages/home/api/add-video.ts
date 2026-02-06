const apiHost = process.env.NEXT_PUBLIC_API_HOST

type Prams = {
	source?: string
	externalId: string
}

export const addVideo = async ({ source = "youtube", externalId }: Prams) => {
	const r = await fetch(`${apiHost}/api/video`, {
		method: "POST",
		headers: { Accept: "application/json", "Content-Type": "application/json" },
		body: JSON.stringify({ source, externalId }),
	})
	const body = await r.json().catch(() => null)

	if (!r.ok) {
		throw Object.assign(new Error(body?.message ?? `HTTP ${r.status}`), {
			status: r.status,
			body,
		})
	}

	return body
}
