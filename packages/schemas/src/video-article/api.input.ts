import { z } from "zod"

export const latestVideoArticlesQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(100),
})
export type LatestVideoArticlesQuery = z.infer<
	typeof latestVideoArticlesQuerySchema
>
