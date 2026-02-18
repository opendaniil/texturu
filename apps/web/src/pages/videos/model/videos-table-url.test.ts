import assert from "node:assert/strict"
import test from "node:test"
import { listVideosQuerySchema } from "@tubebook/schemas"
import {
	parseVideosUrlSearchParams,
	toVideosUrlSearchParams,
} from "./videos-table-url.ts"

test("videos table url", async (t) => {
	await t.test("parses empty url to defaults", () => {
		const parsed = parseVideosUrlSearchParams({})

		assert.deepEqual(parsed, listVideosQuerySchema.parse({}))
	})

	await t.test("parses full query params and maps page to pageIndex", () => {
		const parsed = parseVideosUrlSearchParams({
			page: "3",
			pageSize: "50",
			sortBy: "channelTitle",
			sortDir: "asc",
			status: "done",
			q: "  ai  ",
		})

		assert.deepEqual(parsed, {
			pageIndex: 2,
			pageSize: 50,
			sortBy: "channelTitle",
			sortDir: "asc",
			status: "done",
			q: "ai",
		})
	})

	await t.test("falls back to defaults for invalid params", () => {
		const parsed = parseVideosUrlSearchParams({
			page: "0",
			pageSize: "1000",
			sortBy: "unknown",
			sortDir: "up",
			status: "bad",
			q: "   ",
		})

		assert.deepEqual(parsed, listVideosQuerySchema.parse({}))
	})

	await t.test("serializes defaults to empty query string", () => {
		const query = listVideosQuerySchema.parse({})

		assert.equal(toVideosUrlSearchParams(query).toString(), "")
	})

	await t.test("serializes non-default query in stable key order", () => {
		const query = listVideosQuerySchema.parse({
			pageIndex: 2,
			pageSize: 50,
			sortBy: "channelTitle",
			sortDir: "asc",
			status: "done",
			q: "ai",
		})

		assert.equal(
			toVideosUrlSearchParams(query).toString(),
			"page=3&pageSize=50&sortBy=channelTitle&sortDir=asc&status=done&q=ai"
		)
	})

	await t.test("supports roundtrip parse -> serialize -> parse", () => {
		const parsed = parseVideosUrlSearchParams({
			page: "4",
			pageSize: "10",
			sortBy: "status",
			sortDir: "asc",
			status: "processing",
			q: "  queue  ",
		})
		const roundtrip = parseVideosUrlSearchParams(
			Object.fromEntries(toVideosUrlSearchParams(parsed).entries())
		)

		assert.deepEqual(roundtrip, parsed)
	})
})
