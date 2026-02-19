import { chatRequestSchema } from "@tubebook/schemas"
import { createZodDto } from "nestjs-zod"

export class ChatRequestDto extends createZodDto(chatRequestSchema) {}
