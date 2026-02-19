import type { Column, ColumnDef } from "@tanstack/react-table"
import type { Video, VideoResponse } from "@tubebook/schemas"
import { format, parseISO } from "date-fns"
import { ru } from "date-fns/locale"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { VIDEOS_TABLE_SORT_BY } from "../model/videos-table-features"

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
			<span className="block max-w-[60px] truncate font-mono text-xs">
				{row.original.id}
			</span>
		),
		enableSorting: false,
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
		id: "article",
		header: "Статья",
		cell: ({ row }) => {
			const isReady = row.original.status === "done"

			if (!isReady) return "—"

			const articleId = row.original.id
			return (
				<Link
					href={`/article/${articleId}`}
					className="underline underline-offset-2"
				>
					Открыть
				</Link>
			)
		},
		enableSorting: false,
	},

	{
		accessorKey: VIDEOS_TABLE_SORT_BY.externalId,
		header: ({ column }) => (
			<SortableHeader column={column} label="External ID" />
		),
		cell: ({ row }) => (
			<span className="block max-w-[100px] truncate">
				<Link
					target="_blank"
					href={`https://www.youtube.com/watch?v=${row.original.externalId}`}
				>
					{row.original.externalId}
				</Link>
			</span>
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
				<Link
					target="_blank"
					href={`https://www.youtube.com/channel/${row.original.info?.channelId}`}
				>
					{row.original.info?.channelTitle || "—"}
				</Link>
			</span>
		),
		enableSorting: true,
	},
	{
		accessorKey: "language",
		header: "Язык",
		cell: ({ row }) => (
			<span className="block max-w-[260px] truncate">
				{row.original.info?.language || "—"}
			</span>
		),
		enableSorting: false,
	},
	{
		accessorKey: "category",
		header: "Категории",
		cell: ({ row }) => (
			<span className="block max-w-[260px] truncate">
				{row.original.info?.categories.map((category) => (
					<Badge key={category} variant={"outline"}>
						{category}
					</Badge>
				))}
			</span>
		),
		enableSorting: false,
	},
	{
		accessorKey: "uploadDate",
		header: "Создано",
		cell: ({ row }) => {
			if (!row.original.info?.uploadDate) return "—"
			const d = parseISO(row.original.info?.uploadDate)

			return format(d, "d MMMM yyyy", { locale: ru })
		},
	},
	{
		accessorKey: VIDEOS_TABLE_SORT_BY.createdAt,
		header: ({ column }) => (
			<SortableHeader column={column} label="Добавлено" />
		),
		cell: ({ row }) => {
			const d = parseISO(row.original.createdAt)

			return format(d, "d MMMM yyyy", { locale: ru })
		},
		enableSorting: true,
	},
]
