import { chatResponseSchema } from "@tubebook/schemas"
import { createZodDto } from "nestjs-zod"

export class ChatResponseDto extends createZodDto(chatResponseSchema) {}
