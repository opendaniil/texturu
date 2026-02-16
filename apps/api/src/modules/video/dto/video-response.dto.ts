import { videoResponseSchema } from "@tubebook/schemas"
import { createZodDto } from "nestjs-zod"

export class VideoResponseDto extends createZodDto(videoResponseSchema) {}
