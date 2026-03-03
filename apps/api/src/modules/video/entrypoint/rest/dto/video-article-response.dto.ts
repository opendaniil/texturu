import { videoArticleResponseSchema } from "@texturu/schemas"
import { createZodDto } from "nestjs-zod"

export class VideoArticleResponseDto extends createZodDto(
	videoArticleResponseSchema
) {}
