import { Injectable } from "@nestjs/common"
import { Video, videoSchema } from "@tubebook/schemas"
import { Selectable, sql } from "kysely"
import { Database } from "src/infra/database/database.module"
import { InjectDb } from "src/infra/database/inject.decorator"

type CreateVideoParams = Pick<Video, "source" | "externalId">
type VideoRow = Selectable<Database["videos"]>

@Injectable()
export class VideoRepo {
	constructor(@InjectDb() private readonly db: InjectDb.Client) {}

	private toDomain(video: VideoRow): Video {
		return videoSchema.parse(video)
	}

	async createOrGetByExternalId(
		{ source, externalId }: CreateVideoParams,
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
			...this.toDomain(row),
			isNew,
		}
	}

	async findById(id: string, executor: InjectDb.Client = this.db) {
		const row = await executor
			.selectFrom("videos")
			.selectAll()
			.where("id", "=", id)
			.executeTakeFirst()

		return row ? this.toDomain(row) : null
	}

	async updateStatus(
		videoId: string,
		params: {
			status: Video["status"]
			statusMessage: string
		},
		executor: InjectDb.Client = this.db
	): Promise<boolean | null> {
		const res = await executor
			.updateTable("videos")
			.set({
				status: params.status,
				statusMessage: params.statusMessage,
				updatedAt: new Date(),
			})
			.where("id", "=", videoId)
			.executeTakeFirstOrThrow()

		return res.numUpdatedRows > 0 ? true : null
	}
}
