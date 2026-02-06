import { createZodDto } from "nestjs-zod"
import z from "zod"
import { videoSchema } from "../video.schema"

export class CreateVideoResponseDto extends createZodDto(
	videoSchema.omit({ createdAt: true, updatedAt: true, meta: true }).extend(
		z.object({
			redirectTo: z.string(),
			isNew: z.boolean(),
		}).shape
	)
) {}
