import { createVideoResponseSchema } from "@tubebook/schemas"
import { createZodDto } from "nestjs-zod"

export class CreateVideoResponseDto extends createZodDto(
	createVideoResponseSchema
) {}
