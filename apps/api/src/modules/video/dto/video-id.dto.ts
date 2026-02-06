import { videoIdParamSchema } from "@tubebook/schemas"
import { createZodDto } from "nestjs-zod"

export class VideoIdDto extends createZodDto(videoIdParamSchema) {}
