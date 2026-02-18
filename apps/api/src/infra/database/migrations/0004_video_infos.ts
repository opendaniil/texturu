import { type Kysely, sql } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable("video_infos")

		.addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`uuidv7()`))
		.addColumn("video_id", "uuid", (col) =>
			col.notNull().references("videos.id").onDelete("cascade").unique()
		)

		.addColumn("fulltitle", "text", (col) => col.notNull())
		.addColumn("thumbnail", "text", (col) => col.notNull())
		.addColumn("channel_id", "text", (col) => col.notNull())
		.addColumn("channel_title", "text", (col) => col.notNull())
		.addColumn("duration", "integer", (col) => col.notNull())
		.addColumn("categories", sql`text[]`, (col) => col.notNull())
		.addColumn("tags", sql`text[]`, (col) => col.notNull())
		.addColumn("language", "text", (col) => col.notNull())
		.addColumn("upload_date", "text", (col) => col.notNull())

		.addColumn("created_at", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`now()`)
		)
		.addColumn("updated_at", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`now()`)
		)
		.execute()
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("video_infos").ifExists().execute()
}
