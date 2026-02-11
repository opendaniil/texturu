import { PgVector, PostgresStore } from "@mastra/pg"

const { DATABASE_URL } = process.env

if (!DATABASE_URL) {
	throw new Error("DATABASE_URL is required")
}

export const postgres = new PostgresStore({
	id: "postgres-store",
	connectionString: DATABASE_URL,
})

export const postgresVector = new PgVector({
	id: "postgres-vector",
	connectionString: DATABASE_URL,
})
