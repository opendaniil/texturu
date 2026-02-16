import type { z } from "zod"
import { videoApiSchema } from "./api.js"

export const createVideoRequestSchema = videoApiSchema.pick({
	source: true,
	externalId: true,
})
export type CreateVideoRequest = z.infer<typeof createVideoRequestSchema>
