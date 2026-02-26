import { chatHistoryQuerySchema } from "@tubebook/schemas"
import { createZodDto } from "nestjs-zod"

export class ChatHistoryQueryDto extends createZodDto(chatHistoryQuerySchema) {}
