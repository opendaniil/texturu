import { chatHistoryQuerySchema } from "@texturu/schemas"
import { createZodDto } from "nestjs-zod"

export class ChatHistoryQueryDto extends createZodDto(chatHistoryQuerySchema) {}
