import { type Kysely, sql } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
	await sql`
		update videos
		set status = case
			when status = 'fetching_captions' then 'processing'
			when status = 'no_captions' then 'done'
			else status
		end,
		updated_at = now()
		where status in ('fetching_captions', 'no_captions')
	`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
	await sql`
		update videos
		set status = case
			when status = 'processing' then 'fetching_captions'
			else status
		end,
		updated_at = now()
		where status = 'processing'
	`.execute(db)
}
