import type { Provider } from "@nestjs/common"
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely"
import { Pool } from "pg"
import { AppConfigService } from "../app-config/app-config.service"
import type { DB } from "./database.module"
import { DB_TOKEN } from "./database.tokens"
import type { DB as Database } from "./generated-db-types"

function createPgPool(env: AppConfigService) {
	return new Pool({
		database: env.get("POSTGRES_DB"),
		host: env.get("POSTGRES_HOST"),
		user: env.get("POSTGRES_USER"),
		password: env.get("POSTGRES_PASSWORD"),
		port: env.get("POSTGRES_PORT"),
		max: 10,
	})
}

function createKysely(env: AppConfigService): DB {
	const pool = createPgPool(env)

	return new Kysely<Database>({
		dialect: new PostgresDialect({ pool }),
		plugins: [new CamelCasePlugin()],
	})
}

export const dbProvider: Provider = {
	provide: DB_TOKEN,
	inject: [AppConfigService],
	useFactory: (env: AppConfigService) => createKysely(env),
}
