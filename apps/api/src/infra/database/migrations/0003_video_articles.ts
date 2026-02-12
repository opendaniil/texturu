import { type Kysely, sql } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable("video_articles")
		.addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`uuidv7()`))
		.addColumn("video_id", "uuid", (col) =>
			col.notNull().references("videos.id").onDelete("cascade").unique()
		)
		.addColumn("title", "text", (col) => col.notNull())
		.addColumn("article", "text", (col) => col.notNull())
		.addColumn("created_at", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`now()`)
		)
		.addColumn("updated_at", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`now()`)
		)
		.execute()

	await sql`
		insert into video_articles (video_id, title, article)
		select
			v.id,
			coalesce(v.meta ->> 'title', ''),
			v.meta ->> 'article'
		from videos v
		where
			v.meta is not null
			and jsonb_typeof(v.meta) = 'object'
			and jsonb_typeof(v.meta -> 'article') = 'string'
		on conflict (video_id) do nothing
	`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("video_articles").ifExists().execute()
}
