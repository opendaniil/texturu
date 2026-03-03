import { chatHistoryResponseSchema } from "@texturu/schemas"
import { createZodDto } from "nestjs-zod"

export class ChatHistoryResponseDto extends createZodDto(
	chatHistoryResponseSchema
) {}
