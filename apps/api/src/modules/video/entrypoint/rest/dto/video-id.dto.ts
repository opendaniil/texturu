import { videoSchema } from "@texturu/schemas"
import { createZodDto } from "nestjs-zod"

const videoIdParamSchema = videoSchema.pick({ id: true })

export class VideoIdDto extends createZodDto(videoIdParamSchema) {}
