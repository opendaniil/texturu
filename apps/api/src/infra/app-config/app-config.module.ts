import { Global, Module } from "@nestjs/common"
import { ConfigModule as NestConfigModule } from "@nestjs/config"
import * as Joi from "joi"
import { AppConfigService } from "./app-config.service"

export interface EnvironmentVariables {
	NODE_ENV: "development" | "production"
	API_PORT: number
	YTDLP_PROXY: string

	POSTGRES_USER: string
	POSTGRES_PASSWORD: string
	POSTGRES_DB: string
	POSTGRES_HOST: string
	POSTGRES_PORT: number

	WEB_HOST: string

	REDIS_PORT: number
	REDIS_HOST: string
}

function getSchema() {
	return Joi.object<EnvironmentVariables>({
		NODE_ENV: Joi.string().valid("development", "production").required(),
		API_PORT: Joi.number().required(),
		YTDLP_PROXY: Joi.string().required(),

		POSTGRES_USER: Joi.string().required(),
		POSTGRES_PASSWORD: Joi.string().required(),
		POSTGRES_DB: Joi.string().required(),
		POSTGRES_HOST: Joi.string().required(),
		POSTGRES_PORT: Joi.number().port().required(),

		WEB_HOST: Joi.string().required(),

		REDIS_PORT: Joi.number().required(),
		REDIS_HOST: Joi.string().required(),
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
