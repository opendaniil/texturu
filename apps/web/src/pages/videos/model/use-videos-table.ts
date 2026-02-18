"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type {
	ColumnFiltersState,
	OnChangeFn,
	PaginationState,
	SortingState,
	Updater,
} from "@tanstack/react-table"
import type { ListVideosQuery, Video, VideoResponse } from "@tubebook/schemas"
import { useQueryStates } from "nuqs"
import { useCallback, useEffect, useMemo, useState } from "react"
import { getVideos } from "../api/get-videos"
import {
	buildPaginationMeta,
	buildQueryFromTableState,
	buildStatusColumnFilters,
	buildTableStateFromQuery,
	readStatusFilterFromColumnFilters,
	VIDEOS_TABLE_GLOBAL_FILTER_DEBOUNCE_MS,
	type VideosTableState,
} from "./videos-table-features"
import {
	buildNuqsPatchFromQuery,
	buildQueryFromNuqsState,
	videosTableNuqsParsers,
	videosTableNuqsUrlKeys,
} from "./videos-table-url"

function resolveUpdater<T>(updater: Updater<T>, previous: T): T {
	if (typeof updater === "function") {
		return (updater as (value: T) => T)(previous)
	}

	return updater
}

export type UseVideosTableParams = {
	initialQuery: ListVideosQuery
}

export type UseVideosTableResult = {
	pagination: PaginationState
	sorting: SortingState
	columnFilters: ColumnFiltersState
	globalFilter: string
	setPagination: OnChangeFn<PaginationState>
	onSortingChange: OnChangeFn<SortingState>
	onColumnFiltersChange: OnChangeFn<ColumnFiltersState>
	onGlobalFilterChange: (updater: Updater<string>) => void
	onStatusFilterChange: (value: "all" | Video["status"]) => void
	onPageSizeChange: (pageSize: number) => void
	queryParams: ListVideosQuery
	dataItems: VideoResponse[]
	rowCount: number
	isPending: boolean
	isFetching: boolean
	isError: boolean
	errorMessage: string
	retry: () => void
	statusFilterValue: "all" | Video["status"]
	currentPage: number
	totalPages: number
}

export function useVideosTable({
	initialQuery,
}: UseVideosTableParams): UseVideosTableResult {
	// URL state
	const [urlState, setUrlState] = useQueryStates(videosTableNuqsParsers, {
		urlKeys: videosTableNuqsUrlKeys,
		history: "replace",
		scroll: false,
		shallow: true,
	})

	// API query
	const apiQueryFromUrl = useMemo(
		() => buildQueryFromNuqsState(urlState),
		[urlState]
	)

	// table state
	const tableStateFromApi = useMemo(
		() => buildTableStateFromQuery(apiQueryFromUrl),
		[apiQueryFromUrl]
	)

	const [globalFilter, setGlobalFilter] = useState(initialQuery.q ?? "")
	const { pagination, sorting, columnFilters } = tableStateFromApi

	const syncTableStateToUrl = useCallback(
		(nextTableState: VideosTableState) => {
			const nextApiQuery = buildQueryFromTableState(nextTableState)
			setUrlState(buildNuqsPatchFromQuery(nextApiQuery))
		},
		[setUrlState]
	)

	useEffect(() => {
		const nextGlobalFilter = apiQueryFromUrl.q ?? ""
		setGlobalFilter((previous) =>
			previous === nextGlobalFilter ? previous : nextGlobalFilter
		)
	}, [apiQueryFromUrl.q])

	// table events -> API query -> URL
	const setPagination = useCallback<OnChangeFn<PaginationState>>(
		(updater) => {
			const nextPagination = resolveUpdater(updater, pagination)
			syncTableStateToUrl({
				...tableStateFromApi,
				pagination: nextPagination,
			})
		},
		[pagination, syncTableStateToUrl, tableStateFromApi]
	)

	const onGlobalFilterChange = useCallback((updater: Updater<string>) => {
		setGlobalFilter((previous) => resolveUpdater(updater, previous))
	}, [])

	const onSortingChange = useCallback<OnChangeFn<SortingState>>(
		(updater) => {
			const nextSorting = resolveUpdater(updater, sorting)
			syncTableStateToUrl({
				...tableStateFromApi,
				sorting: nextSorting,
				pagination: { ...pagination, pageIndex: 0 },
			})
		},
		[pagination, sorting, syncTableStateToUrl, tableStateFromApi]
	)

	const syncColumnFiltersToUrl = useCallback(
		(nextColumnFilters: ColumnFiltersState) => {
			const currentStatus = readStatusFilterFromColumnFilters(columnFilters)
			const nextStatus = readStatusFilterFromColumnFilters(nextColumnFilters)
			const shouldResetPage = currentStatus !== nextStatus

			syncTableStateToUrl({
				...tableStateFromApi,
				columnFilters: nextColumnFilters,
				pagination: shouldResetPage
					? { ...pagination, pageIndex: 0 }
					: pagination,
			})
		},
		[columnFilters, pagination, syncTableStateToUrl, tableStateFromApi]
	)

	const onColumnFiltersChange = useCallback<OnChangeFn<ColumnFiltersState>>(
		(updater) => {
			const nextColumnFilters = resolveUpdater(updater, columnFilters)
			syncColumnFiltersToUrl(nextColumnFilters)
		},
		[columnFilters, syncColumnFiltersToUrl]
	)

	const onStatusFilterChange = useCallback(
		(value: "all" | Video["status"]) => {
			const nextColumnFilters = buildStatusColumnFilters(columnFilters, value)
			syncColumnFiltersToUrl(nextColumnFilters)
		},
		[columnFilters, syncColumnFiltersToUrl]
	)

	const onPageSizeChange = useCallback(
		(pageSize: number) => {
			syncTableStateToUrl({
				...tableStateFromApi,
				pagination: {
					pageIndex: 0,
					pageSize,
				},
			})
		},
		[syncTableStateToUrl, tableStateFromApi]
	)

	// local search input -> URL (debounced)
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			const nextQueryValue = globalFilter.trim() || null
			const currentQueryValue = apiQueryFromUrl.q ?? null

			if (nextQueryValue === currentQueryValue) {
				return
			}

			setUrlState({
				q: nextQueryValue,
				pageIndex: 0,
			})
		}, VIDEOS_TABLE_GLOBAL_FILTER_DEBOUNCE_MS)

		return () => clearTimeout(timeoutId)
	}, [apiQueryFromUrl.q, globalFilter, setUrlState])

	const apiQuery = apiQueryFromUrl

	// data fetching
	const {
		data,
		isPending,
		isFetching,
		isError,
		error,
		refetch: retry,
	} = useQuery({
		queryKey: ["videos", apiQuery],
		queryFn: ({ signal }) => getVideos(apiQuery, signal),
		placeholderData: keepPreviousData,
	})

	// view model return
	const dataItems = data?.items ?? []
	const rowCount = data?.rowCount ?? 0
	const { currentPage, totalPages } = buildPaginationMeta(
		rowCount,
		pagination.pageSize,
		pagination.pageIndex
	)
	const statusFilterValue: "all" | Video["status"] =
		readStatusFilterFromColumnFilters(columnFilters) ?? "all"

	return {
		pagination,
		sorting,
		columnFilters,
		globalFilter,
		setPagination,
		onSortingChange,
		onColumnFiltersChange,
		onGlobalFilterChange,
		onStatusFilterChange,
		onPageSizeChange,
		queryParams: apiQuery,
		dataItems,
		rowCount,
		isPending,
		isFetching,
		isError,
		errorMessage:
			error instanceof Error ? error.message : "Ошибка загрузки таблицы",
		retry,
		statusFilterValue,
		currentPage,
		totalPages,
	}
}
