import { latestVideoArticlesQuerySchema } from "@texturu/schemas"
import { createZodDto } from "nestjs-zod"

export class LatestVideoArticlesQueryDto extends createZodDto(
	latestVideoArticlesQuerySchema
) {}
