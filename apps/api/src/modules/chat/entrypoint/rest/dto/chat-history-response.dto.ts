import { chatHistoryResponseSchema } from "@tubebook/schemas"
import { createZodDto } from "nestjs-zod"

export class ChatHistoryResponseDto extends createZodDto(
	chatHistoryResponseSchema
) {}
