import { Injectable } from "@nestjs/common"
import { Selectable, sql } from "kysely"
import { Database } from "src/infra/database/database.module"
import { InjectDb } from "src/infra/database/inject.decorator"
import { VideoJob, videoJobSchema } from "./video-job.schema"

@Injectable()
export class VideoJobRepo {
	constructor(@InjectDb() private readonly db: InjectDb.Client) {}

	private map(row: Selectable<Database["videoJobs"]>): VideoJob {
		return {
			...row,
			state: videoJobSchema.shape.state.parse(row.state),
		}
	}

	async enqueue(
		videoId: string,
		executor: InjectDb.Client = this.db
	): Promise<VideoJob> {
		const row = await executor
			.insertInto("videoJobs")
			.values({ videoId: videoId, state: "queued" })
			.onConflict(
				(oc) =>
					oc
						.column("videoId")
						.where("state", "in", ["queued", "running", "retry_wait"])
						.doUpdateSet({ updatedAt: sql`now()` }) // при конфликте вернуть существующую запись
			)
			.returningAll()
			.executeTakeFirstOrThrow()

		return this.map(row)
	}
}
