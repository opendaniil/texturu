import assert from "node:assert/strict"
import test from "node:test"
import { listVideosQuerySchema } from "@tubebook/schemas"
import { VIDEOS_TABLE_GLOBAL_FILTER_DEBOUNCE_MS } from "./videos-table-features.ts"
import {
	buildNuqsPatchFromQuery,
	buildQueryFromNuqsState,
} from "./videos-table-url.ts"

test("use videos table orchestration", async (t) => {
	await t.test("nuqs state maps to canonical query", () => {
		const query = buildQueryFromNuqsState({
			pageIndex: 2,
			pageSize: 50,
			sortBy: "channelTitle",
			sortDir: "asc",
			status: "done",
			q: "  ai  ",
		})

		assert.deepEqual(query, {
			pageIndex: 2,
			pageSize: 50,
			sortBy: "channelTitle",
			sortDir: "asc",
			status: "done",
			q: "ai",
		})
	})

	await t.test("query maps to nuqs patch with nullable optional keys", () => {
		const query = listVideosQuerySchema.parse({
			pageIndex: 0,
			pageSize: 20,
			sortBy: "updatedAt",
			sortDir: "desc",
		})

		assert.deepEqual(buildNuqsPatchFromQuery(query), {
			pageIndex: 0,
			pageSize: 20,
			sortBy: "updatedAt",
			sortDir: "desc",
			status: null,
			q: null,
		})
	})

	await t.test("uses shared debounce timeout for global filter", () => {
		assert.equal(VIDEOS_TABLE_GLOBAL_FILTER_DEBOUNCE_MS, 350)
	})
})
