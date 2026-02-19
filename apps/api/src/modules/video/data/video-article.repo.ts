import { Injectable } from "@nestjs/common"
import {
	type LatestVideoArticle,
	latestVideoArticleSchema,
	VideoArticle,
	videoArticleSchema,
} from "@tubebook/schemas"
import { Selectable, sql } from "kysely"
import { VideoArticles } from "src/infra/database/generated-db-types"
import { InjectDb } from "src/infra/database/inject.decorator"

@Injectable()
export class VideoArticleRepo {
	constructor(@InjectDb() private readonly db: InjectDb.Client) {}

	private toDomain(row: Selectable<VideoArticles>): VideoArticle {
		return videoArticleSchema.parse(row)
	}

	async findByVideoId(
		videoId: string,
		executor: InjectDb.Client = this.db
	): Promise<Selectable<VideoArticles> | null> {
		const row = await executor
			.selectFrom("videoArticles")
			.selectAll()
			.where("videoId", "=", videoId)
			.executeTakeFirst()

		return row ? this.toDomain(row) : null
	}

	async upsertByVideoId(
		params: {
			videoId: string
			title: string
			description: string
			article: string
		},
		executor: InjectDb.Client = this.db
	): Promise<Selectable<VideoArticles> | null> {
		const row = await executor
			.insertInto("videoArticles")
			.values(params)
			.onConflict((oc) =>
				oc.column("videoId").doUpdateSet({
					title: params.title,
					description: params.description,
					article: params.article,
					updatedAt: sql`now()`,
				})
			)
			.returningAll()
			.executeTakeFirstOrThrow()

		return row ? this.toDomain(row) : null
	}

	async findLatest(
		limit: number,
		executor: InjectDb.Client = this.db
	): Promise<LatestVideoArticle[]> {
		const rows = await executor
			.selectFrom("videoArticles")
			.select(["videoId", "title"])
			.orderBy("createdAt", "desc")
			.orderBy("videoId", "desc")
			.limit(limit)
			.execute()

		return latestVideoArticleSchema.array().parse(rows)
	}
}
