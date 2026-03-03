import { Injectable } from "@nestjs/common"
import { type VideoInfo, videoInfoSchema } from "@texturu/schemas"
import { Selectable, sql } from "kysely"
import { Database } from "src/infra/database/database.module"
import { InjectDb } from "src/infra/database/inject.decorator"

type VideoInfoRow = Selectable<Database["videoInfos"]>
type VideoInfoParams = Omit<VideoInfo, "id" | "createdAt" | "updatedAt">

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

	async findByVideoIds(
		videoIds: string[],
		executor: InjectDb.Client = this.db
	): Promise<VideoInfo[]> {
		if (videoIds.length === 0) return []

		const rows = await executor
			.selectFrom("videoInfos")
			.selectAll()
			.where("videoId", "in", videoIds)
			.execute()

		return rows.map((row) => this.toDomain(row))
	}

	async upsertByVideoId(
		params: VideoInfoParams,
		executor: InjectDb.Client = this.db
	): Promise<VideoInfo | null> {
		const row = await executor
			.insertInto("videoInfos")
			.values(params)
			.onConflict((oc) =>
				oc.column("videoId").doUpdateSet({
					fulltitle: params.fulltitle,
					channelId: params.channelId,
					channelTitle: params.channelTitle,
					duration: params.duration,
					categories: params.categories,
					tags: params.tags,
					language: params.language,
					uploadDate: params.uploadDate,
					updatedAt: sql`now()`,
				})
			)
			.returningAll()
			.executeTakeFirstOrThrow()

		return this.toDomain(row)
	}
}
