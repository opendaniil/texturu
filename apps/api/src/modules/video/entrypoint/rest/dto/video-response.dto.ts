import { videoResponseSchema } from "@texturu/schemas"
import { createZodDto } from "nestjs-zod"

export class VideoResponseDto extends createZodDto(videoResponseSchema) {}
