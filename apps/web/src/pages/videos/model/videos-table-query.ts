import type {
	ColumnFiltersState,
	PaginationState,
	SortingState,
} from "@tanstack/react-table"
import {
	type ListVideosQuery,
	type ListVideosSortBy,
	listVideosQuerySchema,
	videoSchema,
} from "@tubebook/schemas"

type BuildVideosQueryParams = {
	pagination: PaginationState
	sorting: SortingState
	columnFilters: ColumnFiltersState
	globalFilter: string
}

const DEFAULT_SORT_BY: ListVideosSortBy = "updatedAt"
const DEFAULT_SORT_DIR: ListVideosQuery["sortDir"] = "desc"

const SORTABLE_COLUMNS = {
	updatedAt: "updatedAt",
	createdAt: "createdAt",
	externalId: "externalId",
	status: "status",
	fulltitle: "fulltitle",
	channelTitle: "channelTitle",
} as const satisfies Record<ListVideosSortBy, ListVideosSortBy>

type SortableColumn = keyof typeof SORTABLE_COLUMNS

function extractSort(
	sorting: SortingState
): Pick<ListVideosQuery, "sortBy" | "sortDir"> {
	const first = sorting[0]
	const isSortableColumn = (value: string): value is SortableColumn =>
		Object.hasOwn(SORTABLE_COLUMNS, value)

	if (!first || !isSortableColumn(first.id)) {
		return { sortBy: DEFAULT_SORT_BY, sortDir: DEFAULT_SORT_DIR }
	}

	return {
		sortBy: SORTABLE_COLUMNS[first.id],
		sortDir: first.desc ? "desc" : "asc",
	}
}

function extractStatus(
	columnFilters: ColumnFiltersState
): ListVideosQuery["status"] | undefined {
	const raw = columnFilters.find((item) => item.id === "status")?.value
	if (typeof raw !== "string") return undefined

	const parsed = videoSchema.shape.status.safeParse(raw)
	return parsed.success ? parsed.data : undefined
}

export function buildVideosQuery({
	pagination,
	sorting,
	columnFilters,
	globalFilter,
}: BuildVideosQueryParams): ListVideosQuery {
	const { sortBy, sortDir } = extractSort(sorting)
	const status = extractStatus(columnFilters)
	const q = globalFilter.trim() || undefined

	return listVideosQuerySchema.parse({
		pageIndex: pagination.pageIndex,
		pageSize: pagination.pageSize,
		sortBy,
		sortDir,
		...(status ? { status } : {}),
		...(q ? { q } : {}),
	})
}
