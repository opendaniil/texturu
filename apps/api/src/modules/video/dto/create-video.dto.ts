import { createVideoRequestSchema } from "@tubebook/schemas"
import { createZodDto } from "nestjs-zod"

export class CreateVideoDto extends createZodDto(createVideoRequestSchema) {}
