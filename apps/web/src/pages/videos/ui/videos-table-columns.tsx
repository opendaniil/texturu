import type { Column, ColumnDef } from "@tanstack/react-table"
import type { Video, VideoResponse } from "@texturu/schemas"
import { format, parseISO } from "date-fns"
import { ru } from "date-fns/locale"
import {
	ArrowDownIcon,
	ArrowUpDownIcon,
	ArrowUpIcon,
	MoreHorizontal,
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { VIDEOS_TABLE_SORT_BY } from "../model/videos-table-features"
import { DeleteVideoDialog } from "./delete-video-dialog"
import { RegenerateArticleDialog } from "./regenerate-article-dialog"
import { VideoInfoDialog } from "./video-info-dialog"

const statusBadgeVariantByStatus: Record<
	Video["status"],
	"default" | "secondary" | "outline" | "destructive"
> = {
	done: "default",
	generating_article: "secondary",
	fetching_captions: "secondary",
	fetching_info: "secondary",
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

function VideoActionsCell({ video }: { video: VideoResponse }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" className="h-8 w-8 p-0">
					<span className="sr-only">Открыть меню</span>
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end">
				<DropdownMenuLabel>Действия</DropdownMenuLabel>
				<DropdownMenuItem
					onClick={() => navigator.clipboard.writeText(video.id)}
				>
					Скопировать ID видео
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				<VideoInfoDialog video={video}>
					<DropdownMenuItem onSelect={(event) => event.preventDefault()}>
						Информация о видео
					</DropdownMenuItem>
				</VideoInfoDialog>

				{video.status === "done" && (
					<RegenerateArticleDialog videoId={video.id}>
						<DropdownMenuItem onSelect={(event) => event.preventDefault()}>
							Регенерировать
						</DropdownMenuItem>
					</RegenerateArticleDialog>
				)}

				<DropdownMenuSeparator />

				<DeleteVideoDialog videoId={video.id}>
					<DropdownMenuItem onSelect={(event) => event.preventDefault()}>
						Удалить
					</DropdownMenuItem>
				</DeleteVideoDialog>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

export const videosTableColumns: ColumnDef<VideoResponse>[] = [
	{
		id: "actions",
		cell: ({ row }) => <VideoActionsCell video={row.original} />,
	},
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
			<span className="block max-w-[120px] truncate">
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

			return (
				<Link
					href={`/status/${row.original.id}`}
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
