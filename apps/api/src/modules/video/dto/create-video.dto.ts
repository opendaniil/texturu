import { createZodDto } from "nestjs-zod"
import { videoSchema } from "../video.schema"

export class CreateVideoDto extends createZodDto(
	videoSchema.pick({ source: true, externalId: true })
) {}
