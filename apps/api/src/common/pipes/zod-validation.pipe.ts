import { BadRequestException } from "@nestjs/common"
import { createZodValidationPipe } from "nestjs-zod"
import type { ZodError } from "zod"

export const ZodValidationPipe = createZodValidationPipe({
	createValidationException: (err: ZodError) => {
		const messages = err.issues.map((i) => {
			const path = i.path.join(".")
			return path ? `${path}: ${i.message}` : i.message
		})

		// Convert to nest style:
		return new BadRequestException(messages)
	},
})
