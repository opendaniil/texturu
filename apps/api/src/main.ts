import "./instrumentation"

import { Logger } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import cookieParser from "cookie-parser"
import { AppModule } from "./app.module"
import { AppConfigService } from "./infra/app-config/app-config.service"
import { enableCors } from "./infra/cors/cors"
import { OtelLoggerService } from "./infra/otel/otel-logger.service"
import { createSwagger } from "./infra/swagger/swagger"

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		logger: new OtelLoggerService(),
	})
	app.setGlobalPrefix("api")

	app.use(cookieParser())

	const config = app.get(AppConfigService)

	enableCors(app, config)
	if (!config.isProd) createSwagger(app)

	app.enableShutdownHooks()

	await app.listen(3000)

	const logger = new Logger("Bootstrap")
	logger.log(`API started (${config.get("NODE_ENV")})`)
}
bootstrap()
