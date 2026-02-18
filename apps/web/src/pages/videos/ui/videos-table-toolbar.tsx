import type { Video } from "@tubebook/schemas"
import { Input } from "@/shared/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select"
import { Spinner } from "@/shared/ui/spinner"

const statusOptions: Array<{ label: string; value: "all" | Video["status"] }> =
	[
		{ label: "Все статусы", value: "all" },
		{ label: "В очереди", value: "queued" },
		{ label: "В процессе", value: "processing" },
		{ label: "Готово", value: "done" },
		{ label: "Ошибка", value: "error" },
	]

type VideosTableToolbarProps = {
	globalFilter: string
	onGlobalFilterChange: (value: string) => void
	statusFilterValue: "all" | Video["status"]
	onStatusFilterChange: (value: "all" | Video["status"]) => void
	isFetching: boolean
}

export function VideosTableToolbar({
	globalFilter,
	onGlobalFilterChange,
	statusFilterValue,
	onStatusFilterChange,
	isFetching,
}: VideosTableToolbarProps) {
	return (
		<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
			<div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
				<Input
					value={globalFilter}
					onChange={(event) => onGlobalFilterChange(event.target.value)}
					placeholder="Поиск: id, externalId, названию видео и канала"
					className="sm:max-w-sm"
				/>

				<Select value={statusFilterValue} onValueChange={onStatusFilterChange}>
					<SelectTrigger className="w-full sm:w-52">
						<SelectValue placeholder="Статус" />
					</SelectTrigger>

					<SelectContent>
						{statusOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{isFetching && (
				<div className="text-muted-foreground inline-flex items-center gap-2 text-sm">
					<Spinner />
					Обновление...
				</div>
			)}
		</div>
	)
}
