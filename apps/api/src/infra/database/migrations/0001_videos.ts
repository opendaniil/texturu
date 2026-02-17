import { type Kysely, sql } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable("videos")

		.addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`uuidv7()`))

		.addColumn("source", "text", (col) => col.notNull())
		.addColumn("external_id", "text", (col) => col.notNull())
		.addUniqueConstraint("videos_source_external_uq", ["source", "external_id"])

		.addColumn("status", "text", (col) => col.notNull().defaultTo("queued"))
		.addColumn("status_message", "text", (col) => col.notNull().defaultTo(""))

		.addColumn("error", "jsonb")

		.addColumn("created_at", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`now()`)
		)
		.addColumn("updated_at", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`now()`)
		)
		.execute()

	await db.schema
		.createIndex("videos_status_idx")
		.on("videos")
		.column("status")
		.execute()

	await db.schema
		.createIndex("videos_updated_at_idx")
		.on("videos")
		.column("updated_at")
		.execute()
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("videos").ifExists().execute()
}
