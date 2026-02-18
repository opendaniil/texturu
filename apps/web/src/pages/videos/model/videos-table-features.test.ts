import assert from "node:assert/strict"
import test from "node:test"
import type {
	ColumnFiltersState,
	PaginationState,
	SortingState,
} from "@tanstack/react-table"
import { listVideosQuerySchema } from "@tubebook/schemas"
import {
	buildPaginationMeta,
	buildQueryFromTableState,
	buildStatusColumnFilters,
	buildTableStateFromQuery,
	normalizeGlobalSearchValue,
	readStatusFilterFromColumnFilters,
	VIDEOS_TABLE_STATUS_FILTER_ID,
} from "./videos-table-features.ts"

test("videos table features", async (t) => {
	await t.test("builds default sort as updatedAt desc", () => {
		const pagination: PaginationState = { pageIndex: 0, pageSize: 20 }
		const sorting: SortingState = []
		const columnFilters: ColumnFiltersState = []

		const query = buildQueryFromTableState({
			pagination,
			sorting,
			columnFilters,
			globalFilter: "",
		})

		assert.equal(query.sortBy, "updatedAt")
		assert.equal(query.sortDir, "desc")
		assert.equal(query.status, undefined)
		assert.equal(query.q, undefined)
	})

	await t.test("maps sorting and filters to API query", () => {
		const query = buildQueryFromTableState({
			pagination: { pageIndex: 3, pageSize: 50 },
			sorting: [{ id: "channelTitle", desc: false }],
			columnFilters: [{ id: VIDEOS_TABLE_STATUS_FILTER_ID, value: "done" }],
			globalFilter: "  ai channel  ",
		})

		assert.equal(query.sortBy, "channelTitle")
		assert.equal(query.sortDir, "asc")
		assert.equal(query.pageIndex, 3)
		assert.equal(query.pageSize, 50)
		assert.equal(query.status, "done")
		assert.equal(query.q, "ai channel")
	})

	await t.test("falls back on unknown sorting id", () => {
		const query = buildQueryFromTableState({
			pagination: { pageIndex: 1, pageSize: 20 },
			sorting: [{ id: "unknown-column", desc: false }],
			columnFilters: [],
			globalFilter: "",
		})

		assert.equal(query.sortBy, "updatedAt")
		assert.equal(query.sortDir, "desc")
	})

	await t.test("normalizes global search", () => {
		assert.equal(normalizeGlobalSearchValue("  ai  "), "ai")
		assert.equal(normalizeGlobalSearchValue("   "), undefined)
	})

	await t.test("buildStatusColumnFilters applies and clears status", () => {
		const previous: ColumnFiltersState = [{ id: "other", value: "x" }]
		const applied = buildStatusColumnFilters(previous, "done")
		const cleared = buildStatusColumnFilters(applied, "all")

		assert.deepEqual(applied, [
			{ id: "other", value: "x" },
			{ id: VIDEOS_TABLE_STATUS_FILTER_ID, value: "done" },
		])
		assert.deepEqual(cleared, [{ id: "other", value: "x" }])
	})

	await t.test("status filter helper reads values", () => {
		const queued: ColumnFiltersState = [
			{ id: VIDEOS_TABLE_STATUS_FILTER_ID, value: "queued" },
		]
		const error: ColumnFiltersState = [
			{ id: VIDEOS_TABLE_STATUS_FILTER_ID, value: "error" },
		]

		assert.equal(readStatusFilterFromColumnFilters(queued), "queued")
		assert.equal(readStatusFilterFromColumnFilters(error), "error")
		assert.equal(readStatusFilterFromColumnFilters([]), undefined)
	})

	await t.test("pagination helpers keep 1-based page meta", () => {
		assert.deepEqual(buildPaginationMeta(0, 20, 0), {
			currentPage: 1,
			totalPages: 1,
		})
		assert.deepEqual(buildPaginationMeta(101, 20, 2), {
			currentPage: 3,
			totalPages: 6,
		})
	})

	await t.test("query/state roundtrip preserves canonical shape", () => {
		const query = listVideosQuerySchema.parse({
			pageIndex: 2,
			pageSize: 10,
			sortBy: "status",
			sortDir: "asc",
			status: "processing",
			q: "queue",
		})

		const state = buildTableStateFromQuery(query)
		const rebuiltQuery = buildQueryFromTableState(state)

		assert.deepEqual(rebuiltQuery, query)
	})

	await t.test(
		"uses first sorting rule when multiple sorts are provided",
		() => {
			const query = buildQueryFromTableState({
				pagination: { pageIndex: 0, pageSize: 20 },
				sorting: [
					{ id: "status", desc: false },
					{ id: "updatedAt", desc: true },
				],
				columnFilters: [],
				globalFilter: "",
			})

			assert.equal(query.sortBy, "status")
			assert.equal(query.sortDir, "asc")
		}
	)

	await t.test("throws on invalid pagination values", () => {
		assert.throws(
			() =>
				buildQueryFromTableState({
					pagination: { pageIndex: 0, pageSize: 0 },
					sorting: [],
					columnFilters: [],
					globalFilter: "",
				}),
			{ name: "ZodError" }
		)
	})

	await t.test("throws on invalid status filter value", () => {
		assert.throws(
			() =>
				buildQueryFromTableState({
					pagination: { pageIndex: 0, pageSize: 20 },
					sorting: [],
					columnFilters: [
						{
							id: VIDEOS_TABLE_STATUS_FILTER_ID,
							value: "unknown",
						} as unknown as ColumnFiltersState[number],
					],
					globalFilter: "",
				}),
			{ name: "ZodError" }
		)
	})
})
