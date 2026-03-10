import { INestApplication } from "@nestjs/common"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { cleanupOpenApiDoc } from "nestjs-zod"

export function createSwagger(app: INestApplication) {
	const config = new DocumentBuilder()
		.setTitle("Textu.ru API")
		.setDescription("API description")
		.setVersion("1.0")
		.build()

	const openApiDoc = SwaggerModule.createDocument(app, config)
	const cleanedDoc = cleanupOpenApiDoc(openApiDoc)
	SwaggerModule.setup("api", app, cleanedDoc)
}
