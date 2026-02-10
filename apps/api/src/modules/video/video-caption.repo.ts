import { Injectable } from "@nestjs/common"
import { Selectable, sql } from "kysely"
import { Database } from "src/infra/database/database.module"
import { InjectDb } from "src/infra/database/inject.decorator"
import { VideoCaption, videoCaptionSchema } from "./video-caption.schema"

@Injectable()
export class VideoCaptionRepo {
	constructor(@InjectDb() private readonly db: InjectDb.Client) {}

	private map(row: Selectable<Database["videoCaptions"]>): VideoCaption {
		return videoCaptionSchema.parse(row)
	}

	async upsertByVideoId(
		params: { videoId: string; vttText: string; plainText: string },
		executor: InjectDb.Client = this.db
	): Promise<VideoCaption> {
		const row = await executor
			.insertInto("videoCaptions")
			.values(params)
			.onConflict((oc) =>
				oc.column("videoId").doUpdateSet({
					vttText: params.vttText,
					plainText: params.plainText,
					updatedAt: sql`now()`,
				})
			)
			.returningAll()
			.executeTakeFirstOrThrow()

		return this.map(row)
	}

	async findByVideoId(
		videoId: string,
		executor: InjectDb.Client = this.db
	): Promise<VideoCaption | null> {
		const row = await executor
			.selectFrom("videoCaptions")
			.selectAll()
			.where("videoId", "=", videoId)
			.executeTakeFirst()

		if (!row) {
			return null
		}

		return this.map(row)
	}
}
