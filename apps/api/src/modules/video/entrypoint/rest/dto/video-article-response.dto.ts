import { videoArticleResponseSchema } from "@tubebook/schemas"
import { createZodDto } from "nestjs-zod"

export class VideoArticleResponseDto extends createZodDto(
	videoArticleResponseSchema
) {}
