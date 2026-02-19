"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import {
	Marquee,
	MarqueeContent,
	MarqueeEdge,
	MarqueeItem,
} from "@/shared/ui/marquee"
import { getLatestArticles } from "../api/get-latest-articles"

export function LatestArticles() {
	const { data, isPending, isError } = useQuery({
		queryKey: ["home", "latest-articles"],
		queryFn: ({ signal }) => getLatestArticles(signal),
		refetchInterval: 10_000,
	})

	if (isError) {
		return (
			<p className="text-center text-sm text-muted-foreground">
				Не удалось загрузить последние статьи
			</p>
		)
	}

	const items = data?.items ?? []

	if (!isPending && items.length === 0) {
		return (
			<p className="text-center text-sm text-muted-foreground">
				Пока нет готовых статей
			</p>
		)
	}

	const marqueeItems = isPending
		? Array.from({ length: 5 }, (_, index) => ({
				videoId: `loading-${index}`,
				title: "Загружаем последние статьи...",
			}))
		: items

	return (
		<Marquee aria-label="Marquee" pauseOnHover pauseOnKeyboard>
			<MarqueeContent>
				{marqueeItems.map((item) => (
					<MarqueeItem key={item.videoId} asChild>
						<Link
							href={isPending ? "#" : `/article/${item.videoId}`}
							aria-disabled={isPending}
							className="flex w-[260px] flex-col gap-1 rounded-md border bg-card p-4 text-card-foreground shadow-sm aria-disabled:pointer-events-none"
						>
							<div className="text-sm leading-tight sm:text-base">
								{item.title}
							</div>
						</Link>
					</MarqueeItem>
				))}
			</MarqueeContent>

			<MarqueeEdge side="left" />
			<MarqueeEdge side="right" />
		</Marquee>
	)
}
