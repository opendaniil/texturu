import { videoSchema } from "@tubebook/schemas"
import { createZodDto } from "nestjs-zod"

export class VideoResponseDto extends createZodDto(videoSchema) {}
