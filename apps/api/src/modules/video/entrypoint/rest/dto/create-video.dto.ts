import { createVideoRequestSchema } from "@texturu/schemas"
import { createZodDto } from "nestjs-zod"

export class CreateVideoDto extends createZodDto(createVideoRequestSchema) {}
