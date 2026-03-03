import { listVideosQuerySchema } from "@texturu/schemas"
import { createZodDto } from "nestjs-zod"

export class ListVideosQueryDto extends createZodDto(listVideosQuerySchema) {}
