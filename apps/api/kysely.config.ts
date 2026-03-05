import { defineConfig } from "kysely-ctl"
import { Pool } from "pg"

function resolvePostgresConnectionString(env: NodeJS.ProcessEnv): string {
	const missing = [
		"POSTGRES_USER",
		"POSTGRES_PASSWORD",
		"POSTGRES_HOST",
		"POSTGRES_PORT",
		"POSTGRES_DB",
	].filter((key) => !env[key])

	if (missing.length > 0) {
		throw new Error(
			`POSTGRES_* variables must be set. Missing: ${missing.join(", ")}`
		)
	}

	const user = env.POSTGRES_USER as string
	const password = env.POSTGRES_PASSWORD as string
	const host = env.POSTGRES_HOST as string
	const port = env.POSTGRES_PORT as string
	const database = env.POSTGRES_DB as string

	return `postgresql://${user}:${password}@${host}:${port}/${database}`
}

export default defineConfig({
	dialect: "pg",
	dialectConfig: {
		pool: new Pool({
			connectionString: resolvePostgresConnectionString(process.env),
		}),
	},
	migrations: {
		migrationFolder: "src/infra/database/migrations",
	},
	plugins: [],
	seeds: {
		seedFolder: "seeds",
	},
})
