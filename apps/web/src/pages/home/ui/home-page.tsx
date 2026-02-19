import { BackgroundLines } from "@/shared/ui/background-lines"
import { container } from "@/shared/ui/container"
import { LatestArticles } from "./latest-articles"
import { SendLinkForm } from "./send-link-form"

export function HomePage() {
	const heading = "Экономь время на просмотре YouTube видео"
	const description =
		"Вставь ссылку и получи структурированный конспект за несколько минут вместо долгого просмотра."

	return (
		<main className={container.default}>
			<section className="flex h-full h-full w-full items-center justify-center overflow-hidden py-32">
				<BackgroundLines className="container flex w-full flex-col items-center justify-center px-4 md:h-full">
					<h1 className="relative z-20 py-2 text-center font-sans text-4xl font-semibold tracking-tighter text-balance md:py-10 sm:text-5xl lg:text-6xl">
						{heading}
					</h1>

					<p className="text-md mx-auto max-w-2xl text-center text-muted-foreground lg:text-lg">
						{description}
					</p>

					<div className="relative z-20 mt-10 w-full max-w-2xl">
						<SendLinkForm />
					</div>

					<div className="mt-20">
						<h3 className="relative z-20 text-center font-sans tracking-tighter text-balance py-2 text-2xl font-semibold text-muted-foreground">
							Недавние статьи
						</h3>

						<LatestArticles />
					</div>
				</BackgroundLines>
			</section>
		</main>
	)
}
