import { listVideosResponseSchema } from "@tubebook/schemas"
import { createZodDto } from "nestjs-zod"

export class ListVideosResponseDto extends createZodDto(
	listVideosResponseSchema
) {}
