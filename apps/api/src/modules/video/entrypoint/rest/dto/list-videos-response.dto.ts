import { listVideosResponseSchema } from "@texturu/schemas"
import { createZodDto } from "nestjs-zod"

export class ListVideosResponseDto extends createZodDto(
	listVideosResponseSchema
) {}
