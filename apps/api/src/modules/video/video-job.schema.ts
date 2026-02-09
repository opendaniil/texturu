import z from "zod"

export const videoJobSchema = z.object({
	id: z.uuidv7(),

	videoId: z.uuidv7(),
	step: z.enum(["fetching_captions", "captions_process"]),
	bullJobId: z.string().nullable(),
	payload: z.any(),
	result: z.any().nullable(),
	state: z.enum(["queued", "running", "retry_wait", "done", "error"]),
	statusMessage: z.string(),

	attempt: z.number(),
	maxAttempts: z.number(),

	runAt: z.date(),
	startedAt: z.date().nullable(),
	finishedAt: z.date().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
})
export type VideoJob = z.infer<typeof videoJobSchema>
