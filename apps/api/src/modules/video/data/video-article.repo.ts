import { Injectable } from "@nestjs/common"
import {
	type LatestVideoArticle,
	latestVideoArticleSchema,
	type SitemapVideoArticle,
	sitemapVideoArticleSchema,
	type VideoArticle,
	videoArticleSchema,
} from "@texturu/schemas"
import { Selectable, sql } from "kysely"
import { VideoArticles } from "src/infra/database/generated-db-types"
import { InjectDb } from "src/infra/database/inject.decorator"

type VideoArticleRow = Selectable<VideoArticles>

@Injectable()
export class VideoArticleRepo {
	constructor(@InjectDb() private readonly db: InjectDb.Client) {}

	private toDomain(row: VideoArticleRow): VideoArticle {
		return videoArticleSchema.parse(row)
	}

	async findById(
		id: string,
		executor: InjectDb.Client = this.db
	): Promise<VideoArticle | null> {
		const row = await executor
			.selectFrom("videoArticles")
			.selectAll()
			.where("id", "=", id)
			.executeTakeFirst()

		return row ? this.toDomain(row) : null
	}

	async findByVideoId(
		videoId: string,
		executor: InjectDb.Client = this.db
	): Promise<VideoArticle | null> {
		const row = await executor
			.selectFrom("videoArticles")
			.selectAll()
			.where("videoId", "=", videoId)
			.executeTakeFirst()

		return row ? this.toDomain(row) : null
	}

	async findBySlug(
		slug: string,
		executor: InjectDb.Client = this.db
	): Promise<VideoArticle | null> {
		const row = await executor
			.selectFrom("videoArticles")
			.selectAll()
			.where("slug", "=", slug)
			.executeTakeFirst()

		return row ? this.toDomain(row) : null
	}

	async upsert(
		params: Omit<VideoArticle, "id" | "createdAt" | "updatedAt">,
		executor: InjectDb.Client = this.db
	): Promise<VideoArticle> {
		const row = await executor
			.insertInto("videoArticles")
			.values({
				videoId: params.videoId,
				slug: params.slug,
				title: params.title,
				description: params.description,
				globalSummary: params.globalSummary,
				sections: sql`${JSON.stringify(params.sections)}::jsonb`,
				article: params.article,
			})
			// regenerate article
			.onConflict((oc) =>
				oc.column("videoId").doUpdateSet({
					title: params.title,
					description: params.description,
					globalSummary: params.globalSummary,
					sections: sql`${JSON.stringify(params.sections)}::jsonb`,
					article: params.article,
					updatedAt: sql`now()`,
				})
			)
			.returningAll()
			.executeTakeFirstOrThrow()

		return this.toDomain(row)
	}

	async findForSitemap(
		executor: InjectDb.Client = this.db
	): Promise<SitemapVideoArticle[]> {
		const rows = await executor
			.selectFrom("videoArticles")
			.select(["slug", "updatedAt"])
			.orderBy("createdAt", "desc")
			.execute()

		return sitemapVideoArticleSchema.array().parse(rows)
	}

	async findLatest(
		limit: number,
		executor: InjectDb.Client = this.db
	): Promise<LatestVideoArticle[]> {
		const rows = await executor
			.selectFrom("videoArticles")
			.select(["slug", "title"])
			.orderBy("createdAt", "desc")
			.orderBy("id", "desc")
			.limit(limit)
			.execute()

		return latestVideoArticleSchema.array().parse(rows)
	}
}
