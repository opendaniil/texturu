import type { z } from "zod"
import { videoSchema } from "./domain.js"

export const createVideoRequestSchema = videoSchema.pick({
	source: true,
	externalId: true,
})
export type CreateVideoRequest = z.infer<typeof createVideoRequestSchema>
