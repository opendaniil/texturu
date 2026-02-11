import z from "zod"

export const videoJobSchema = z.object({
	id: z.uuidv7(),

	videoId: z.uuidv7(),
	payload: z.any(),
	state: z.enum(["queued", "running", "done", "error"]),
	startedAt: z.date().nullable(),
	finishedAt: z.date().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
})
export type VideoJob = z.infer<typeof videoJobSchema>
