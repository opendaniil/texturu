import { latestVideoArticlesQuerySchema } from "@tubebook/schemas"
import { createZodDto } from "nestjs-zod"

export class LatestVideoArticlesQueryDto extends createZodDto(
	latestVideoArticlesQuerySchema
) {}
