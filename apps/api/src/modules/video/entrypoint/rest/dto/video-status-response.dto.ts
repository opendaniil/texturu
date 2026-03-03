import { videoStatusResponseSchema } from "@texturu/schemas"
import { createZodDto } from "nestjs-zod"

export class VideoStatusResponseDto extends createZodDto(
	videoStatusResponseSchema
) {}
