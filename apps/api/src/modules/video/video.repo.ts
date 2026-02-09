import { Injectable } from "@nestjs/common"
import { Selectable, sql, Updateable } from "kysely"
import { Database } from "src/infra/database/database.module"
import { InjectDb } from "src/infra/database/inject.decorator"
import { CreateVideoDto } from "./dto/create-video.dto"
import { Video, videoSchema } from "./video.schema"

@Injectable()
export class VideoRepo {
	constructor(@InjectDb() private readonly db: InjectDb.Client) {}

	private map(video: Selectable<Database["videos"]>): Video {
		return {
			...video,
			source: videoSchema.shape.source.parse(video.source),
			status: videoSchema.shape.status.parse(video.status),
			meta: videoSchema.shape.meta.parse(video.meta),
		}
	}

	async create(
		{ source, externalId }: CreateVideoDto,
		executor: InjectDb.Client = this.db
	) {
		const row = await executor
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
			isNew: row.isNew,
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

	async updateCaptionsResult(
		videoId: string,
		params: {
			status: Video["status"]
			statusMessage: string
			meta: Video["meta"]
		},
		executor: InjectDb.Client = this.db
	) {
		return this.updateStatus(videoId, params, executor)
	}

	async updateStatus(
		videoId: string,
		params: {
			status: Video["status"]
			statusMessage: string
			meta?: Video["meta"]
		},
		executor: InjectDb.Client = this.db
	) {
		const patch: Updateable<Database["videos"]> = {
			status: params.status,
			statusMessage: params.statusMessage,
			updatedAt: new Date(),
		}

		if (params.meta !== undefined) {
			patch.meta = params.meta
		}

		const row = await executor
			.updateTable("videos")
			.set(patch)
			.where("id", "=", videoId)
			.returningAll()
			.executeTakeFirstOrThrow()

		return this.map(row)
	}
}
