import { type Kysely, sql } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable("video_jobs")
		.addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`uuidv7()`))

		.addColumn("video_id", "uuid", (col) =>
			col.notNull().references("videos.id").onDelete("cascade")
		)

		.addColumn("state", "text", (col) => col.notNull().defaultTo("queued"))

		.addColumn("attempt", "integer", (col) => col.notNull().defaultTo(0))
		.addColumn("max_attempts", "integer", (col) => col.notNull().defaultTo(5))
		.addColumn("run_at", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`now()`)
		)
		.addColumn("payload", "jsonb", (col) =>
			col.notNull().defaultTo(sql`'{}'::jsonb`)
		)
		.addColumn("started_at", "timestamptz")
		.addColumn("finished_at", "timestamptz")

		.addColumn("created_at", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`now()`)
		)
		.addColumn("updated_at", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`now()`)
		)

		.execute()

	await db.schema
		.createIndex("video_jobs_state_run_at_idx")
		.on("video_jobs")
		.columns(["state", "run_at"])
		.execute()

	await db.schema
		.createIndex("video_jobs_one_active_per_video_uq")
		.unique()
		.on("video_jobs")
		.column("video_id")
		.where(sql.ref("state"), "in", ["queued", "running", "retry_wait"])
		.execute()
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("video_jobs").ifExists().execute()
}
