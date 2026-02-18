"use client"

import {
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table"
import type { ListVideosQuery } from "@tubebook/schemas"
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
import { useVideosTable } from "../model/use-videos-table"
import { videosTableColumns } from "./videos-table-columns"
import { VideosTablePagination } from "./videos-table-pagination"
import { VideosTableToolbar } from "./videos-table-toolbar"

type VideosTableProps = {
	initialQuery: ListVideosQuery
}

export function VideosTable({ initialQuery }: VideosTableProps) {
	const {
		pagination,
		sorting,
		columnFilters,
		globalFilter,
		setPagination,
		onSortingChange,
		onColumnFiltersChange,
		onGlobalFilterChange,
		dataItems,
		rowCount,
		isPending,
		isFetching,
		isError,
		errorMessage,
		retry,
		statusFilterValue,
		currentPage,
		totalPages,
		onStatusFilterChange,
		onPageSizeChange,
	} = useVideosTable({ initialQuery })
	const columns = videosTableColumns

	const table = useReactTable({
		data: dataItems,
		columns,
		state: {
			pagination,
			sorting,
			columnFilters,
			globalFilter,
		},
		onPaginationChange: setPagination,
		onSortingChange,
		onColumnFiltersChange,
		onGlobalFilterChange,
		manualPagination: true,
		manualSorting: true,
		manualFiltering: true,
		enableMultiSort: false,
		rowCount,
		getCoreRowModel: getCoreRowModel(),
	})

	const rows = table.getRowModel().rows
	const hasRows = rows.length > 0

	return (
		<div className="space-y-4">
			<VideosTableToolbar
				globalFilter={globalFilter}
				onGlobalFilterChange={onGlobalFilterChange}
				statusFilterValue={statusFilterValue}
				onStatusFilterChange={onStatusFilterChange}
				isFetching={isFetching}
			/>

			{isError && (
				<div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2">
					<p className="text-sm">{errorMessage}</p>
					<Button variant="outline" size="sm" onClick={retry}>
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
				onPageSizeChange={onPageSizeChange}
				onPreviousPage={() => table.previousPage()}
				onNextPage={() => table.nextPage()}
				canPreviousPage={table.getCanPreviousPage()}
				canNextPage={table.getCanNextPage()}
			/>
		</div>
	)
}
