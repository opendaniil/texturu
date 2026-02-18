import { listVideosQuerySchema } from "@tubebook/schemas"
import { createZodDto } from "nestjs-zod"

export class ListVideosQueryDto extends createZodDto(listVideosQuerySchema) {}
