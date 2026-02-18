import type { HttpExceptionBody } from "@tubebook/schemas"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST
if (!API_HOST) throw new Error("NEXT_PUBLIC_API_HOST is not set")

const normalizePath = (path: string): string =>
	path.startsWith("/") ? path : `/${path}`

export class ApiClientError extends Error {
	readonly status: number
	readonly body: HttpExceptionBody | null

	constructor(status: number, body: HttpExceptionBody | null) {
		super(`HTTP ${status}`)
		this.name = "ApiClientError"
		this.status = status
		this.body = body
	}
}

export async function apiClient<TSuccess>(
	path: string,
	init?: RequestInit
): Promise<TSuccess> {
	const response = await fetch(`${API_HOST}${normalizePath(path)}`, init)
	const body: unknown = await response.json().catch(() => null)

	if (!response.ok) {
		throw new ApiClientError(response.status, body as HttpExceptionBody | null)
	}

	return body as TSuccess
}
