import { Injectable } from "@nestjs/common"
import { sql } from "kysely"
import { InjectDb } from "src/infra/database/inject.decorator"
import { VideoCaption } from "./video-caption.schema"

@Injectable()
export class VideoCaptionRepo {
	constructor(@InjectDb() private readonly db: InjectDb.Client) {}

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

		return row
	}

	async findPlainTextByVideoId(
		videoId: string,
		executor: InjectDb.Client = this.db
	): Promise<VideoCaption["plainText"] | null> {
		const row = await executor
			.selectFrom("videoCaptions")
			.select("plainText")
			.where("videoId", "=", videoId)
			.executeTakeFirst()

		if (!row) {
			return null
		}

		return row.plainText
	}
}
