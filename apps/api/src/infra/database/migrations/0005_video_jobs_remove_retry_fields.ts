import { type Kysely, sql } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema.dropIndex("video_jobs_state_run_at_idx").ifExists().execute()
	await db.schema
		.dropIndex("video_jobs_one_active_per_video_uq")
		.ifExists()
		.execute()

	await sql`alter table video_jobs drop column if exists attempt`.execute(db)
	await sql`alter table video_jobs drop column if exists max_attempts`.execute(db)
	await sql`alter table video_jobs drop column if exists run_at`.execute(db)

	await db.schema
		.createIndex("video_jobs_one_active_per_video_uq")
		.unique()
		.on("video_jobs")
		.column("video_id")
		.where(sql.ref("state"), "in", ["queued", "running"])
		.execute()
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema
		.dropIndex("video_jobs_one_active_per_video_uq")
		.ifExists()
		.execute()

	await sql`
		alter table video_jobs
		add column if not exists attempt integer not null default 0
	`.execute(db)
	await sql`
		alter table video_jobs
		add column if not exists max_attempts integer not null default 5
	`.execute(db)
	await sql`
		alter table video_jobs
		add column if not exists run_at timestamptz not null default now()
	`.execute(db)

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
