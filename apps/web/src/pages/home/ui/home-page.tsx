import { Hero } from "@/shared/components/hero"
import { Form } from "./form"

export function HomePage() {
	return (
		<Hero
			heading="Экономь время на просмотре видео"
			description="Вместо просмотра длинных видео прочитай его за минуты. Сэкономь время, которое потратитишь на просмотр длинных видео."
		>
			<Form />
		</Hero>
	)
}
