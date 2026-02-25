import { Injectable } from "@nestjs/common"
import {
	type LatestVideoArticle,
	latestVideoArticleSchema,
	type VideoArticle,
	videoArticleSchema,
} from "@tubebook/schemas"
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

	async create(
		params: {
			videoId: string
			slug: string
			title: string
			description: string
			article: string
		},
		executor: InjectDb.Client = this.db
	): Promise<VideoArticle> {
		const row = await executor
			.insertInto("videoArticles")
			.values(params)
			.returningAll()
			.executeTakeFirstOrThrow()

		return this.toDomain(row)
	}

	async updateById(
		id: string,
		params: {
			title: string
			description: string
			article: string
			slug?: string
		},
		executor: InjectDb.Client = this.db
	): Promise<VideoArticle> {
		const row = await executor
			.updateTable("videoArticles")
			.set({
				title: params.title,
				description: params.description,
				article: params.article,
				...(params.slug !== undefined ? { slug: params.slug } : {}),
				updatedAt: sql`now()`,
			})
			.where("id", "=", id)
			.returningAll()
			.executeTakeFirstOrThrow()

		return this.toDomain(row)
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
