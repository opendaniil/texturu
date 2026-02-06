import { createZodDto } from "nestjs-zod"
import z from "zod"
import { videoSchema } from "../video.schema"

export class VideoStatusResponseDto extends createZodDto(
	videoSchema.omit({ createdAt: true, meta: true }).extend(
		z.object({
			isFinal: z.boolean(),
		}).shape
	)
) {}
