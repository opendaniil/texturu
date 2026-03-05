import { sitemapVideoArticlesResponseSchema } from "@texturu/schemas"
import { createZodDto } from "nestjs-zod"

export class SitemapVideoArticlesResponseDto extends createZodDto(
	sitemapVideoArticlesResponseSchema
) {}
