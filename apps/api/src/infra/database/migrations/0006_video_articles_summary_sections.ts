import { type Kysely, sql } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable("video_articles")
		.addColumn("global_summary", "text", (col) => col.notNull().defaultTo(""))
		.addColumn("sections", "jsonb", (col) =>
			col.notNull().defaultTo(sql`'[]'::jsonb`)
		)
		.execute()
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable("video_articles")
		.dropColumn("sections")
		.dropColumn("global_summary")
		.execute()
}
