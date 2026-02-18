import { Button } from "@/shared/ui/button"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select"

const pageSizeOptions = [10, 20, 50, 100] as const

type VideosTablePaginationProps = {
	rowCount: number
	currentPage: number
	totalPages: number
	pageSize: number
	onPageSizeChange: (pageSize: number) => void
	onPreviousPage: () => void
	onNextPage: () => void
	canPreviousPage: boolean
	canNextPage: boolean
}

export function VideosTablePagination({
	rowCount,
	currentPage,
	totalPages,
	pageSize,
	onPageSizeChange,
	onPreviousPage,
	onNextPage,
	canPreviousPage,
	canNextPage,
}: VideosTablePaginationProps) {
	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="text-muted-foreground text-sm">
				Всего: {rowCount}. Страница {currentPage} из {totalPages}.
			</div>

			<div className="flex items-center gap-2">
				<Select
					value={String(pageSize)}
					onValueChange={(value) => onPageSizeChange(Number(value))}
				>
					<SelectTrigger className="w-28">
						<SelectValue placeholder="Показывать" />
					</SelectTrigger>

					<SelectContent>
						{pageSizeOptions.map((value) => (
							<SelectItem key={value} value={String(value)}>
								{value} / стр.
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Button
					variant="outline"
					size="sm"
					onClick={onPreviousPage}
					disabled={!canPreviousPage}
				>
					Prev
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={onNextPage}
					disabled={!canNextPage}
				>
					Next
				</Button>
			</div>
		</div>
	)
}
