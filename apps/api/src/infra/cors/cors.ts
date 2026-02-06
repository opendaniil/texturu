import { INestApplication } from "@nestjs/common"
import { AppConfigService } from "../app-config/app-config.service"

export function enableCors(app: INestApplication, config: AppConfigService) {
	app.enableCors({
		origin: [config.get("WEB_HOST")],
		credentials: true,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	})
}
