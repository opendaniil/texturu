import { videoStatusResponseSchema } from "@tubebook/schemas"
import { createZodDto } from "nestjs-zod"

export class VideoStatusResponseDto extends createZodDto(
	videoStatusResponseSchema
) {}
