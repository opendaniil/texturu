import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { AppConfigService } from "./infra/app-config/app-config.service"
import { enableCors } from "./infra/cors/cors"
import { createSwagger } from "./infra/swagger/swagger"

async function bootstrap() {
	const app = await NestFactory.create(AppModule)
	app.setGlobalPrefix("api")

	const config = app.get(AppConfigService)
	console.log("[NODE_ENV]", config.get("NODE_ENV"))

	enableCors(app, config)
	if (!config.isProd) createSwagger(app)

	await app.listen(config.get("API_PORT"))
}
bootstrap()
