import { Global, Module } from "@nestjs/common"
import { ConfigModule as NestConfigModule } from "@nestjs/config"
import * as Joi from "joi"
import { AppConfigService } from "./app-config.service"

export interface EnvironmentVariables {
	NODE_ENV: "development" | "production"
	API_PORT: number

	POSTGRES_USER: string
	POSTGRES_PASSWORD: string
	POSTGRES_DB: string
	POSTGRES_HOST: string
	POSTGRES_PORT: number
}

function getSchema() {
	return Joi.object<EnvironmentVariables>({
		NODE_ENV: Joi.string().valid("development", "production").required(),
		API_PORT: Joi.number().required(),

		POSTGRES_USER: Joi.string().required(),
		POSTGRES_PASSWORD: Joi.string().required(),
		POSTGRES_DB: Joi.string().required(),
		POSTGRES_HOST: Joi.string().required(),
		POSTGRES_PORT: Joi.number().port().required(),
	})
}

@Global()
@Module({
	imports: [
		NestConfigModule.forRoot({
			cache: true,
			envFilePath: [
				`.env.${process.env.NODE_ENV}.local`,
				`.env.${process.env.NODE_ENV}`,
				".env.local",
				".env",
			],

			validationSchema: getSchema(),
			validationOptions: {
				abortEarly: false,
				expandVariables: true,
			},
		}),
	],
	providers: [AppConfigService],
	exports: [NestConfigModule, AppConfigService],
})
export class AppConfigModule {}
