import { Injectable } from "@nestjs/common"
import { Insertable, Selectable, sql, Updateable } from "kysely"
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
		payload: Insertable<Database["videoJobs"]>["payload"],
		executor: InjectDb.Client = this.db
	): Promise<VideoJob> {
		const row = await executor
			.insertInto("videoJobs")
			.values({ videoId: videoId, state: "queued", payload })
			.onConflict(
				(oc) =>
					oc
						.column("videoId")
						.where("state", "in", ["queued", "running", "retry_wait"])
						.doUpdateSet({ updatedAt: sql`now()`, payload }) // при конфликте вернуть существующую запись
			)
			.returningAll()
			.executeTakeFirstOrThrow()

		return this.map(row)
	}

	async updateActive(
		videoId: string,
		patch: Updateable<Database["videoJobs"]>,
		executor: InjectDb.Client = this.db
	): Promise<VideoJob | null> {
		const row = await executor
			.updateTable("videoJobs")
			.set({ ...patch, updatedAt: new Date() })
			.where("videoId", "=", videoId)
			.where("state", "in", ["queued", "running", "retry_wait"])
			.returningAll()
			.executeTakeFirst()

		if (!row) {
			return null
		}

		return this.map(row)
	}
}
