import { type Kysely, sql } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable("video_captions")
		.addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`uuidv7()`))
		.addColumn("video_id", "uuid", (col) =>
			col.notNull().references("videos.id").onDelete("cascade").unique()
		)
		.addColumn("vtt_text", "text", (col) => col.notNull())
		.addColumn("plain_text", "text", (col) => col.notNull())
		.addColumn("created_at", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`now()`)
		)
		.addColumn("updated_at", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`now()`)
		)
		.execute()
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("video_captions").ifExists().execute()
}
