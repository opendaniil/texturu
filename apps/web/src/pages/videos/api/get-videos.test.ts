import assert from "node:assert/strict"
import test from "node:test"
import type { ListVideosQuery } from "@tubebook/schemas"

const defaultQuery: ListVideosQuery = {
	pageIndex: 0,
	pageSize: 20,
	sortBy: "updatedAt",
	sortDir: "desc",
}

const validResponseBody = {
	items: [
		{
			id: "01890f5e-3f65-7f3a-8b6c-92e5f5f2a001",
			source: "youtube",
			externalId: "dQw4w9WgXcQ",
			status: "done",
			statusMessage: "",
			createdAt: "2025-01-01T00:00:00.000Z",
			updatedAt: "2025-01-01T01:00:00.000Z",
			info: null,
		},
	],
	rowCount: 1,
}

let getVideosPromise: Promise<typeof import("./get-videos.ts")> | null = null

async function loadGetVideos() {
	if (!getVideosPromise) {
		getVideosPromise = import("./get-videos.ts")
	}

	const module = await getVideosPromise
	return module.getVideos
}

test("getVideos API", async (t) => {
	const originalFetch = globalThis.fetch

	t.after(() => {
		globalThis.fetch = originalFetch
	})

	await t.test("requests API and parses successful response", async () => {
		const getVideos = await loadGetVideos()
		const controller = new AbortController()
		let capturedUrl: URL | null = null
		let capturedInit: RequestInit | undefined

		globalThis.fetch = async (input, init) => {
			capturedUrl = new URL(String(input))
			capturedInit = init
			return new Response(JSON.stringify(validResponseBody), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			})
		}

		const result = await getVideos(
			{
				...defaultQuery,
				sortBy: "channelTitle",
				sortDir: "asc",
				pageIndex: 2,
				pageSize: 50,
				status: "fetching_info",
				q: "  ai  ",
			},
			controller.signal
		)

		assert.deepEqual(result, validResponseBody)
		assert.ok(capturedUrl)
		const requestUrl = capturedUrl as URL
		assert.equal(requestUrl.pathname, "/api/video")
		assert.equal(requestUrl.searchParams.get("pageIndex"), "2")
		assert.equal(requestUrl.searchParams.get("pageSize"), "50")
		assert.equal(requestUrl.searchParams.get("sortBy"), "channelTitle")
		assert.equal(requestUrl.searchParams.get("sortDir"), "asc")
		assert.equal(requestUrl.searchParams.get("status"), "fetching_info")
		assert.equal(requestUrl.searchParams.get("q"), "ai")
		assert.equal(capturedInit?.method, "GET")
		assert.deepEqual(capturedInit?.headers, { Accept: "application/json" })
		assert.equal(capturedInit?.signal, controller.signal)
	})

	await t.test("omits optional status and q when they are absent", async () => {
		const getVideos = await loadGetVideos()
		let capturedUrl: URL | null = null

		globalThis.fetch = async (input) => {
			capturedUrl = new URL(String(input))
			return new Response(JSON.stringify(validResponseBody), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			})
		}

		await getVideos(defaultQuery)

		assert.ok(capturedUrl)
		const requestUrl = capturedUrl as URL
		assert.equal(requestUrl.searchParams.has("status"), false)
		assert.equal(requestUrl.searchParams.has("q"), false)
	})

	await t.test(
		"fails fast on invalid query and does not call fetch",
		async () => {
			const getVideos = await loadGetVideos()
			let fetchCalled = false

			globalThis.fetch = async () => {
				fetchCalled = true
				return new Response(null, { status: 200 })
			}

			await assert.rejects(
				() =>
					getVideos({
						...defaultQuery,
						pageSize: 1000,
					}),
				{ name: "ZodError" }
			)

			assert.equal(fetchCalled, false)
		}
	)

	await t.test("throws API error with message, status and body", async () => {
		const getVideos = await loadGetVideos()

		globalThis.fetch = async () =>
			new Response(JSON.stringify({ message: "Database unavailable" }), {
				status: 503,
				headers: { "Content-Type": "application/json" },
			})

		await assert.rejects(
			() => getVideos(defaultQuery),
			(error: unknown) => {
				assert.ok(error instanceof Error)
				assert.equal(error.message, "Database unavailable")
				assert.equal((error as { status?: unknown }).status, 503)
				assert.deepEqual((error as { body?: unknown }).body, {
					message: "Database unavailable",
				})
				return true
			}
		)
	})

	await t.test(
		"falls back to HTTP status when error response is not JSON",
		async () => {
			const getVideos = await loadGetVideos()

			globalThis.fetch = async () =>
				new Response("gateway timeout", {
					status: 504,
					headers: { "Content-Type": "text/plain" },
				})

			await assert.rejects(
				() => getVideos(defaultQuery),
				(error: unknown) => {
					assert.ok(error instanceof Error)
					assert.equal(error.message, "HTTP 504")
					assert.equal((error as { status?: unknown }).status, 504)
					assert.equal((error as { body?: unknown }).body, null)
					return true
				}
			)
		}
	)

	await t.test(
		"throws when successful response does not match schema",
		async () => {
			const getVideos = await loadGetVideos()

			globalThis.fetch = async () =>
				new Response(
					JSON.stringify({
						items: validResponseBody.items,
						rowCount: -1,
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					}
				)

			await assert.rejects(() => getVideos(defaultQuery), { name: "ZodError" })
		}
	)
})
