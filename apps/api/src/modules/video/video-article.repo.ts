import { Injectable } from "@nestjs/common"
import { Selectable, sql } from "kysely"
import { Database } from "src/infra/database/database.module"
import { InjectDb } from "src/infra/database/inject.decorator"
import { VideoArticle, videoArticleSchema } from "./video-article.schema"

@Injectable()
export class VideoArticleRepo {
	constructor(@InjectDb() private readonly db: InjectDb.Client) {}

	private map(row: Selectable<Database["videoArticles"]>): VideoArticle {
		return videoArticleSchema.parse(row)
	}

	async upsertByVideoId(
		params: { videoId: string; title: string; article: string },
		executor: InjectDb.Client = this.db
	): Promise<VideoArticle> {
		const row = await executor
			.insertInto("videoArticles")
			.values(params)
			.onConflict((oc) =>
				oc.column("videoId").doUpdateSet({
					title: params.title,
					article: params.article,
					updatedAt: sql`now()`,
				})
			)
			.returningAll()
			.executeTakeFirstOrThrow()

		return this.map(row)
	}
}
