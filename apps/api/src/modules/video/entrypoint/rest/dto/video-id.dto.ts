import { videoSchema } from "@tubebook/schemas"
import { createZodDto } from "nestjs-zod"

const videoIdParamSchema = videoSchema.pick({ id: true })

export class VideoIdDto extends createZodDto(videoIdParamSchema) {}
