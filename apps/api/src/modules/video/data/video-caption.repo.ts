import { Injectable } from "@nestjs/common"
import { VideoCaption, videoCaptionSchema } from "@texturu/schemas"
import { Selectable, sql } from "kysely"
import { VideoCaptions } from "src/infra/database/generated-db-types"
import { InjectDb } from "src/infra/database/inject.decorator"

@Injectable()
export class VideoCaptionRepo {
	constructor(@InjectDb() private readonly db: InjectDb.Client) {}

	private toDomain(row: Selectable<VideoCaptions>): VideoCaption {
		return videoCaptionSchema.parse(row)
	}

	async upsertByVideoId(
		params: { videoId: string; vttText: string; plainText: string },
		executor: InjectDb.Client = this.db
	): Promise<VideoCaption | null> {
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

		return row ? this.toDomain(row) : null
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

		return row?.plainText ?? null
	}
}
