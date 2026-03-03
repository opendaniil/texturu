export class DomainError extends Error {
	constructor(
		message: string,
		readonly statusCode: number = 500,
		cause?: unknown
	) {
		super(message, { cause })
		this.name = this.constructor.name
	}
}
