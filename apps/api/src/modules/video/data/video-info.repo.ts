import { Injectable } from "@nestjs/common"
import { type VideoInfo, videoInfoSchema } from "@tubebook/schemas"
import { Selectable, sql } from "kysely"
import { Database } from "src/infra/database/database.module"
import { InjectDb } from "src/infra/database/inject.decorator"

type VideoInfoRow = Selectable<Database["videoInfos"]>

@Injectable()
export class VideoInfoRepo {
	constructor(@InjectDb() private readonly db: InjectDb.Client) {}

	private toDomain(row: VideoInfoRow): VideoInfo {
		return videoInfoSchema.parse(row)
	}

	async findByVideoId(
		videoId: string,
		executor: InjectDb.Client = this.db
	): Promise<VideoInfo | null> {
		const row = await executor
			.selectFrom("videoInfos")
			.selectAll()
			.where("videoId", "=", videoId)
			.executeTakeFirst()

		return row ? this.toDomain(row) : null
	}

	async upsertByVideoId(
		params: { videoId: string } & Partial<VideoInfo>,
		executor: InjectDb.Client = this.db
	): Promise<VideoInfo | null> {
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

		return this.toDomain(row)
	}
}
