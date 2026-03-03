import { chatRequestSchema } from "@texturu/schemas"
import { createZodDto } from "nestjs-zod"

export class ChatRequestDto extends createZodDto(chatRequestSchema) {}
