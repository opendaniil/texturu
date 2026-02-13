import { Injectable } from "@nestjs/common"
import { Selectable, sql } from "kysely"
import { AppConfigService } from "src/infra/app-config/app-config.service"
import { Database } from "src/infra/database/database.module"
import { InjectDb } from "src/infra/database/inject.decorator"
import { CreateVideoDto } from "./dto/create-video.dto"
import { Video, videoSchema } from "./video.schema"

@Injectable()
export class VideoRepo {
	constructor(
		@InjectDb() private readonly db: InjectDb.Client,
		private readonly config: AppConfigService
	) {}

	private map(video: Selectable<Database["videos"]>): Video {
		if (this.config.isProd) return video as Video
		return videoSchema.parse(video)
	}

	async createOrGetByExternalId(
		{ source, externalId }: CreateVideoDto,
		executor: InjectDb.Client = this.db
	): Promise<Video & { isNew: boolean }> {
		const { isNew, ...row } = await executor
			.insertInto("videos")
			.values({ externalId: externalId, source })
			.onConflict(
				(oc) =>
					oc
						.columns(["source", "externalId"])
						.doUpdateSet({ updatedAt: sql`videos.updated_at` }) // при конфликте вернуть существующую запись
			)
			.returningAll()
			.returning(sql<boolean>`(xmax = 0)`.as("isNew")) // определение новая ли эта запись
			.executeTakeFirstOrThrow()

		return {
			...this.map(row),
			isNew,
		}
	}

	async findById(id: string, executor: InjectDb.Client = this.db) {
		const row = await executor
			.selectFrom("videos")
			.selectAll()
			.where("id", "=", id)
			.executeTakeFirst()

		if (!row) return null
		return this.map(row)
	}

	async updateStatus(
		videoId: string,
		params: {
			status: Video["status"]
			statusMessage: string
		},
		executor: InjectDb.Client = this.db
	) {
		const res = await executor
			.updateTable("videos")
			.set({
				status: params.status,
				statusMessage: params.statusMessage,
				updatedAt: new Date(),
			})
			.where("id", "=", videoId)
			.executeTakeFirstOrThrow()

		return res
	}

	async saveArticle(
		videoId: string,
		article: string,
		executor: InjectDb.Client = this.db
	) {
		const res = await executor
			.updateTable("videos")
			.set({
				meta: sql`jsonb_set(coalesce(meta, '{}'::jsonb), '{article}', to_jsonb(${article}::text), true)`,
				updatedAt: new Date(),
			})
			.where("id", "=", videoId)
			.executeTakeFirstOrThrow()

		return res
	}
}
