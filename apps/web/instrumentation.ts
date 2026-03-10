import { SeverityNumber } from "@opentelemetry/api-logs"

export async function register() {
	if (process.env.NEXT_RUNTIME === "nodejs") {
		const { register } = await import("./instrumentation.node")
		register()
	}
}

export async function onRequestError(
	error: { digest: string } & Error,
	request: {
		path: string
		method: string
		headers: { [key: string]: string }
	},
	context: { routerKind: string; routePath: string; routeType: string }
) {
	if (process.env.NEXT_RUNTIME === "nodejs") {
		const { logger } = await import("./instrumentation.node")
		logger.emit({
			severityNumber: SeverityNumber.ERROR,
			body: error.message,
			attributes: {
				"error.digest": error.digest,
				"error.stack": error.stack,
				"request.path": request.path,
				"request.method": request.method,
				"nextjs.routerKind": context.routerKind,
				"nextjs.routePath": context.routePath,
				"nextjs.routeType": context.routeType,
			},
		})
	}
}
