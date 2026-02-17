import { Form } from "./form"
import { Hero } from "./hero"

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
