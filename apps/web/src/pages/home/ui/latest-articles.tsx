"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import {
	Marquee,
	MarqueeContent,
	MarqueeEdge,
	MarqueeItem,
} from "@/shared/ui/marquee"
import { Skeleton } from "@/shared/ui/skeleton"
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
	const skeletonItems = Array.from({ length: 5 }, (_, index) => index)

	if (!isPending && items.length === 0) {
		return (
			<p className="text-center text-sm text-muted-foreground">
				Пока нет готовых статей
			</p>
		)
	}

	return (
		<Marquee aria-label="Marquee" pauseOnHover pauseOnKeyboard>
			<MarqueeContent>
				{isPending &&
					skeletonItems.map((index) => (
						<MarqueeItem key={index}>
							<div
								aria-hidden="true"
								className="pb-12 flex w-[260px] flex-col gap-2 rounded-md border bg-card p-4 text-card-foreground shadow-sm"
							>
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-2/3" />
							</div>
						</MarqueeItem>
					))}

				{items.map((item) => (
					<MarqueeItem key={item.slug} asChild>
						<Link
							href={`/article/${item.slug}`}
							className="flex w-[260px] flex-col gap-1 rounded-md border bg-card p-4 text-card-foreground shadow-sm"
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
