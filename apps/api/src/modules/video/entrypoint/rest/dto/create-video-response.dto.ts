import { createVideoResponseSchema } from "@texturu/schemas"
import { createZodDto } from "nestjs-zod"

export class CreateVideoResponseDto extends createZodDto(
	createVideoResponseSchema
) {}
