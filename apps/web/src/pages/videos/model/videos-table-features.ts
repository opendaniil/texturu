import type {
	ColumnFiltersState,
	PaginationState,
	SortingState,
} from "@tanstack/react-table"
import type {
	ListVideosQuery,
	ListVideosSortBy,
	Video,
} from "@texturu/schemas"

export type VideosTableState = {
	pagination: PaginationState
	sorting: SortingState
	columnFilters: ColumnFiltersState
	globalFilter: string
}

type SortableColumn = keyof typeof VIDEOS_TABLE_SORT_BY

export const VIDEOS_TABLE_GLOBAL_FILTER_DEBOUNCE_MS = 350
export const VIDEOS_TABLE_STATUS_FILTER_ID = "status"

export const VIDEOS_TABLE_SORT_BY = {
	updatedAt: "updatedAt",
	createdAt: "createdAt",
	externalId: "externalId",
	status: "status",
	fulltitle: "fulltitle",
	channelTitle: "channelTitle",
} as const satisfies Record<ListVideosSortBy, ListVideosSortBy>

const DEFAULT_SORT_BY: ListVideosSortBy = "updatedAt"
const DEFAULT_SORT_DIR: ListVideosQuery["sortDir"] = "desc"

// search feature
export function normalizeGlobalSearchValue(raw: string): string | undefined {
	const normalized = raw.trim()
	return normalized ? normalized : undefined
}

// status-filter feature
export function readStatusFilterFromColumnFilters(filters: ColumnFiltersState) {
	return filters.find((item) => item.id === VIDEOS_TABLE_STATUS_FILTER_ID)
		?.value as Video["status"] | undefined
}

export function buildStatusColumnFilters(
	previous: ColumnFiltersState,
	value: "all" | Video["status"]
): ColumnFiltersState {
	const withoutStatus = previous.filter(
		(item) => item.id !== VIDEOS_TABLE_STATUS_FILTER_ID
	)

	if (value === "all") {
		return withoutStatus
	}

	return [...withoutStatus, { id: VIDEOS_TABLE_STATUS_FILTER_ID, value }]
}

export function buildPaginationMeta(
	rowCount: number,
	pageSize: number,
	pageIndex: number
): {
	currentPage: number
	totalPages: number
} {
	const totalPages = Math.max(1, Math.ceil(rowCount / pageSize))

	return {
		currentPage: pageIndex + 1,
		totalPages,
	}
}

// query mapping feature
export function buildTableStateFromQuery(
	query: ListVideosQuery
): VideosTableState {
	return {
		pagination: {
			pageIndex: query.pageIndex,
			pageSize: query.pageSize,
		},
		sorting: [{ id: query.sortBy, desc: query.sortDir === "desc" }],
		columnFilters: query.status
			? [{ id: VIDEOS_TABLE_STATUS_FILTER_ID, value: query.status }]
			: [],
		globalFilter: query.q ?? "",
	}
}

export function buildQueryFromTableState(
	state: VideosTableState
): ListVideosQuery {
	const firstSorting = state.sorting[0]
	const isSortableColumn = (value: string): value is SortableColumn =>
		Object.hasOwn(VIDEOS_TABLE_SORT_BY, value)

	const sortBy =
		firstSorting && isSortableColumn(firstSorting.id)
			? VIDEOS_TABLE_SORT_BY[firstSorting.id]
			: DEFAULT_SORT_BY

	const sortDir: ListVideosQuery["sortDir"] =
		firstSorting && isSortableColumn(firstSorting.id)
			? firstSorting.desc
				? "desc"
				: "asc"
			: DEFAULT_SORT_DIR

	const status = readStatusFilterFromColumnFilters(state.columnFilters)

	const q = normalizeGlobalSearchValue(state.globalFilter)

	return {
		pageIndex: state.pagination.pageIndex,
		pageSize: state.pagination.pageSize,
		sortBy,
		sortDir,
		...(status ? { status } : {}),
		...(q ? { q } : {}),
	}
}
