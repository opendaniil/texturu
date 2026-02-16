import { type Kysely, sql } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable("video_infos")
		.addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`uuidv7()`))
		.addColumn("video_id", "uuid", (col) =>
			col.notNull().references("videos.id").onDelete("cascade").unique()
		)
		.addColumn("fulltitle", "text")
		.addColumn("description", "text")
		.addColumn("channel_id", "text")
		.addColumn("channel_title", "text")
		.addColumn("duration", "integer")
		.addColumn("categories", sql`text[]`, (col) =>
			col.notNull().defaultTo(sql`'{}'::text[]`)
		)
		.addColumn("tags", sql`text[]`, (col) =>
			col.notNull().defaultTo(sql`'{}'::text[]`)
		)
		.addColumn("language", "text")
		.addColumn("created_at", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`now()`)
		)
		.addColumn("updated_at", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`now()`)
		)
		.execute()

	await db.schema.alterTable("videos").dropColumn("meta").execute()
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.alterTable("videos").addColumn("meta", "jsonb").execute()
	await db.schema.dropTable("video_infos").ifExists().execute()
}
