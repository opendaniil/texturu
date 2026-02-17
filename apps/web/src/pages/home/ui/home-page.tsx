import { BackgroundLines } from "@/components/ui/background-lines"
import { SendLinkForm } from "./send-link-form"

export function HomePage() {
	const heading = "Экономь время на просмотре YouTube видео"
	const description =
		"Вставь ссылку и получи структурированный конспект за несколько минут вместо долгого просмотра."

	return (
		<main className="min-h-dvh">
			<section className="flex h-full min-h-screen w-screen items-center justify-center overflow-hidden py-32">
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
				</BackgroundLines>
			</section>
		</main>
	)
}
