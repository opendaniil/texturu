import type { ListVideosQuery } from "@tubebook/schemas"
import { container } from "@/shared/ui/container"
import { VideosTable } from "./videos-table"

export const metadata = {
	title: "Все видео",
}

type VideosPageProps = {
	initialQuery: ListVideosQuery
}

export function VideosPage({ initialQuery }: VideosPageProps) {
	return (
		<main className="min-h-dvh">
			<section className="py-8 sm:py-12">
				<div className={`${container.default} flex flex-col gap-6`}>
					<div className="space-y-2">
						<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
							Все видео
						</h1>
						<p className="text-muted-foreground">
							Таблица с фильтрацией, сортировкой и пагинацией на стороне
							сервера.
						</p>
					</div>

					<VideosTable initialQuery={initialQuery} />
				</div>
			</section>
		</main>
	)
}
