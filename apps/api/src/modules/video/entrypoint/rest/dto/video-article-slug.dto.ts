import { videoArticleApiSchema } from "@texturu/schemas"
import { createZodDto } from "nestjs-zod"
import { z } from "zod"

const videoArticleSlugParamSchema = z.object({
	slug: videoArticleApiSchema.shape.slug,
})

export class VideoArticleSlugDto extends createZodDto(
	videoArticleSlugParamSchema
) {}
