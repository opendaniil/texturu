import type { Column, ColumnDef } from "@tanstack/react-table"
import type { Video, VideoResponse } from "@tubebook/schemas"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { VIDEOS_TABLE_SORT_BY } from "../model/videos-table-features"

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
	dateStyle: "short",
	timeStyle: "short",
})

const statusBadgeVariantByStatus: Record<
	Video["status"],
	"default" | "secondary" | "outline" | "destructive"
> = {
	done: "default",
	processing: "secondary",
	queued: "outline",
	error: "destructive",
}

function SortableHeader({
	column,
	label,
}: {
	column: Column<VideoResponse, unknown>
	label: string
}) {
	const sorted = column.getIsSorted()

	return (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			className="-ml-2 h-auto px-2 py-1 font-medium"
			onClick={() => column.toggleSorting(sorted === "asc")}
		>
			{label}
			{sorted === "asc" && <ArrowUpIcon className="size-3.5" />}
			{sorted === "desc" && <ArrowDownIcon className="size-3.5" />}
			{!sorted && <ArrowUpDownIcon className="size-3.5 opacity-70" />}
		</Button>
	)
}

export const videosTableColumns: ColumnDef<VideoResponse>[] = [
	{
		accessorKey: "id",
		header: "ID",
		cell: ({ row }) => (
			<span className="block max-w-[40px] truncate font-mono text-xs">
				{row.original.id}
			</span>
		),
		enableSorting: false,
	},
	{
		accessorKey: VIDEOS_TABLE_SORT_BY.externalId,
		header: ({ column }) => (
			<SortableHeader column={column} label="External ID" />
		),
		enableSorting: true,
	},
	{
		id: VIDEOS_TABLE_SORT_BY.fulltitle,
		accessorFn: (row) => row.info?.fulltitle ?? "",
		header: ({ column }) => <SortableHeader column={column} label="Название" />,
		cell: ({ row }) => (
			<span className="block max-w-[360px] truncate">
				{row.original.info?.fulltitle || "—"}
			</span>
		),
		enableSorting: true,
	},
	{
		id: VIDEOS_TABLE_SORT_BY.channelTitle,
		accessorFn: (row) => row.info?.channelTitle ?? "",
		header: ({ column }) => <SortableHeader column={column} label="Канал" />,
		cell: ({ row }) => (
			<span className="block max-w-[220px] truncate">
				{row.original.info?.channelTitle || "—"}
			</span>
		),
		enableSorting: true,
	},
	{
		accessorKey: VIDEOS_TABLE_SORT_BY.status,
		header: ({ column }) => <SortableHeader column={column} label="Статус" />,
		cell: ({ row }) => (
			<Badge variant={statusBadgeVariantByStatus[row.original.status]}>
				{row.original.status}
			</Badge>
		),
		enableSorting: true,
	},
	{
		accessorKey: "statusMessage",
		header: "Сообщение",
		cell: ({ row }) => (
			<span className="block max-w-[260px] truncate">
				{row.original.statusMessage || "—"}
			</span>
		),
		enableSorting: false,
	},
	{
		accessorKey: VIDEOS_TABLE_SORT_BY.updatedAt,
		header: ({ column }) => (
			<SortableHeader column={column} label="Обновлено" />
		),
		cell: ({ row }) => {
			const parsed = new Date(row.original.updatedAt)

			return Number.isNaN(parsed.getTime())
				? "—"
				: dateTimeFormatter.format(parsed)
		},
		enableSorting: true,
	},
]
