import { videoArticleSchema } from "@tubebook/schemas"
import { createZodDto } from "nestjs-zod"

export class VideoArticleResponseDto extends createZodDto(videoArticleSchema) {}
