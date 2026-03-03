import { latestVideoArticlesResponseSchema } from "@texturu/schemas"
import { createZodDto } from "nestjs-zod"

export class LatestVideoArticlesResponseDto extends createZodDto(
	latestVideoArticlesResponseSchema
) {}
