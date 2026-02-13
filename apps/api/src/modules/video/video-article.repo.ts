import { Injectable } from "@nestjs/common"
import { VideoArticle } from "@tubebook/schemas"
import { sql } from "kysely"
import { InjectDb } from "src/infra/database/inject.decorator"

@Injectable()
export class VideoArticleRepo {
	constructor(@InjectDb() private readonly db: InjectDb.Client) {}

	async findByVideoId(
		videoId: string,
		executor: InjectDb.Client = this.db
	): Promise<VideoArticle | null> {
		const row = await executor
			.selectFrom("videoArticles")
			.selectAll()
			.where("videoId", "=", videoId)
			.executeTakeFirst()

		if (!row) {
			return null
		}

		return row
	}

	async upsertByVideoId(
		params: { videoId: string; title: string; article: string },
		executor: InjectDb.Client = this.db
	): Promise<VideoArticle | null> {
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

		if (!row) {
			return null
		}

		return row
	}
}
