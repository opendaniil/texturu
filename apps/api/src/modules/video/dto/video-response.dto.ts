import { createZodDto } from "nestjs-zod"
import { videoSchema } from "../video.schema"

export class VideoResponseDto extends createZodDto(videoSchema) {}
