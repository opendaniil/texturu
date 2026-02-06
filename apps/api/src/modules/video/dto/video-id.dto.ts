import { createZodDto } from "nestjs-zod"
import { videoSchema } from "../video.schema"

export class VideoIdDto extends createZodDto(videoSchema.pick({ id: true })) {}
