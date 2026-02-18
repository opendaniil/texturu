import z from "zod"

export const HttpExceptionBodySchema = z.object({
	statusCode: z.number().int(),
	message: z.union([z.string(), z.array(z.string())]),
	error: z.string().optional(),
})
export type HttpExceptionBody = z.infer<typeof HttpExceptionBodySchema>
