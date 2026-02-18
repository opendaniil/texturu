"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	type PaginationState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table"
import type { Video } from "@tubebook/schemas"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/shared/ui/button"
import { Spinner } from "@/shared/ui/spinner"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/table"
import { getVideos } from "../api/get-videos"
import { buildVideosQuery } from "../model/videos-table-query"
import { videosTableColumns } from "./videos-table-columns"
import { VideosTablePagination } from "./videos-table-pagination"
import { VideosTableToolbar } from "./videos-table-toolbar"

export function VideosTable() {
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 20,
	})
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "updatedAt", desc: true },
	])
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
	const [globalFilter, setGlobalFilter] = useState("")
	const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("")
	const resetPagination = useCallback(() => {
		setPagination((previous) =>
			previous.pageIndex === 0 ? previous : { ...previous, pageIndex: 0 }
		)
	}, [])

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			setDebouncedGlobalFilter(globalFilter)
			resetPagination()
		}, 350)

		return () => window.clearTimeout(timeoutId)
	}, [globalFilter, resetPagination])

	const queryParams = useMemo(
		() =>
			buildVideosQuery({
				pagination,
				sorting,
				columnFilters,
				globalFilter: debouncedGlobalFilter,
			}),
		[pagination, sorting, columnFilters, debouncedGlobalFilter]
	)
	const columns = videosTableColumns

	const { data, isPending, isFetching, isError, error, refetch } = useQuery({
		queryKey: ["videos", queryParams],
		queryFn: ({ signal }) => getVideos(queryParams, signal),
		placeholderData: keepPreviousData,
	})

	const table = useReactTable({
		data: data?.items ?? [],
		columns,
		state: {
			pagination,
			sorting,
			columnFilters,
			globalFilter,
		},
		onPaginationChange: setPagination,
		onSortingChange: (updater) => {
			setSorting(updater)
			resetPagination()
		},
		onColumnFiltersChange: (updater) => {
			setColumnFilters(updater)
			resetPagination()
		},
		onGlobalFilterChange: setGlobalFilter,
		manualPagination: true,
		manualSorting: true,
		manualFiltering: true,
		enableMultiSort: false,
		rowCount: data?.rowCount ?? 0,
		getCoreRowModel: getCoreRowModel(),
	})

	const rows = table.getRowModel().rows
	const hasRows = rows.length > 0
	const rowCount = data?.rowCount ?? 0
	const totalPages = Math.max(1, Math.ceil(rowCount / pagination.pageSize))
	const currentPage = pagination.pageIndex + 1
	const statusColumn = table.getColumn("status")
	const statusFilterValue: "all" | Video["status"] =
		(statusColumn?.getFilterValue() as Video["status"] | undefined) ?? "all"
	const errorMessage =
		error instanceof Error ? error.message : "Ошибка загрузки таблицы"

	return (
		<div className="space-y-4">
			<VideosTableToolbar
				globalFilter={globalFilter}
				onGlobalFilterChange={(value) => table.setGlobalFilter(value)}
				statusFilterValue={statusFilterValue}
				onStatusFilterChange={(value) => {
					statusColumn?.setFilterValue(value === "all" ? undefined : value)
				}}
				isFetching={isFetching}
			/>

			{isError && (
				<div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2">
					<p className="text-sm">{errorMessage}</p>
					<Button variant="outline" size="sm" onClick={() => refetch()}>
						Повторить
					</Button>
				</div>
			)}

			<div className="rounded-lg border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext()
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>

					<TableBody>
						{isPending && !hasRows && (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="py-12 text-center"
								>
									<div className="inline-flex items-center gap-2 text-sm">
										<Spinner />
										Загрузка видео...
									</div>
								</TableCell>
							</TableRow>
						)}

						{isError && !hasRows && (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="py-12 text-center"
								>
									Не удалось загрузить данные
								</TableCell>
							</TableRow>
						)}

						{!isError && !isPending && !hasRows && (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="py-12 text-center"
								>
									Видео не найдены
								</TableCell>
							</TableRow>
						)}

						{rows.map((row) => (
							<TableRow key={row.id}>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<VideosTablePagination
				rowCount={rowCount}
				currentPage={currentPage}
				totalPages={totalPages}
				pageSize={pagination.pageSize}
				onPageSizeChange={(pageSize) => {
					setPagination({
						pageIndex: 0,
						pageSize,
					})
				}}
				onPreviousPage={() => table.previousPage()}
				onNextPage={() => table.nextPage()}
				canPreviousPage={table.getCanPreviousPage()}
				canNextPage={table.getCanNextPage()}
			/>
		</div>
	)
}
