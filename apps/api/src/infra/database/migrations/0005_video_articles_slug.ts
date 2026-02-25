import { type Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable("video_articles")
		.addColumn("slug", "text", (col) => col.notNull())
		.execute()

	await db.schema
		.createIndex("video_articles_slug_uidx")
		.on("video_articles")
		.column("slug")
		.unique()
		.execute()
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropIndex("video_articles_slug_uidx").ifExists().execute()

	await db.schema.alterTable("video_articles").dropColumn("slug").execute()
}
