import { latestVideoArticlesResponseSchema } from "@tubebook/schemas"
import { createZodDto } from "nestjs-zod"

export class LatestVideoArticlesResponseDto extends createZodDto(
	latestVideoArticlesResponseSchema
) {}
