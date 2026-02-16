import { Injectable } from "@nestjs/common"
import {
	type VideoInfoPayload,
	videoInfoPayloadSchema,
} from "@tubebook/schemas"
import { Selectable, sql } from "kysely"
import { AppConfigService } from "src/infra/app-config/app-config.service"
import { Database } from "src/infra/database/database.module"
import { InjectDb } from "src/infra/database/inject.decorator"

type VideoInfoRow = Selectable<Database["videoInfos"]>

@Injectable()
export class VideoInfoRepo {
	constructor(
		@InjectDb() private readonly db: InjectDb.Client,
		private readonly config: AppConfigService
	) {}

	private mapPayload(row: VideoInfoRow): VideoInfoPayload {
		const payload: VideoInfoPayload = {
			fulltitle: row.fulltitle,
			description: row.description,
			channelId: row.channelId,
			channelTitle: row.channelTitle,
			duration: row.duration,
			categories: row.categories,
			tags: row.tags,
			language: row.language,
		}

		if (this.config.isProd) {
			return payload
		}

		return videoInfoPayloadSchema.parse(payload)
	}

	async findByVideoId(
		videoId: string,
		executor: InjectDb.Client = this.db
	): Promise<VideoInfoPayload | null> {
		const row = await executor
			.selectFrom("videoInfos")
			.selectAll()
			.where("videoId", "=", videoId)
			.executeTakeFirst()

		if (!row) {
			return null
		}

		return this.mapPayload(row)
	}

	async upsertByVideoId(
		params: { videoId: string } & VideoInfoPayload,
		executor: InjectDb.Client = this.db
	): Promise<VideoInfoPayload> {
		const row = await executor
			.insertInto("videoInfos")
			.values(params)
			.onConflict((oc) =>
				oc.column("videoId").doUpdateSet({
					fulltitle: params.fulltitle,
					description: params.description,
					channelId: params.channelId,
					channelTitle: params.channelTitle,
					duration: params.duration,
					categories: params.categories,
					tags: params.tags,
					language: params.language,
					updatedAt: sql`now()`,
				})
			)
			.returningAll()
			.executeTakeFirstOrThrow()

		return this.mapPayload(row)
	}
}
