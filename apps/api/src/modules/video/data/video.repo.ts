import { Injectable } from "@nestjs/common"
import { type ListVideosQuery, Video, videoSchema } from "@tubebook/schemas"
import { Selectable, type StringReference, sql } from "kysely"
import { Database } from "src/infra/database/database.module"
import { InjectDb } from "src/infra/database/inject.decorator"

type CreateVideoParams = Pick<Video, "source" | "externalId">
type VideoRow = Selectable<Database["videos"]>
type FindPageResult = { items: Video[]; rowCount: number }
type ListSortColumn = StringReference<Database, "videos" | "videoInfos">

const listSortColumns = {
	updatedAt: "videos.updatedAt",
	createdAt: "videos.createdAt",
	externalId: "videos.externalId",
	status: "videos.status",
	fulltitle: "videoInfos.fulltitle",
	channelTitle: "videoInfos.channelTitle",
} as const satisfies Record<ListVideosQuery["sortBy"], ListSortColumn>

@Injectable()
export class VideoRepo {
	constructor(@InjectDb() private readonly db: InjectDb.Client) {}

	private toDomain(video: VideoRow): Video {
		return videoSchema.parse(video)
	}

	async findPage(
		query: ListVideosQuery,
		executor: InjectDb.Client = this.db
	): Promise<FindPageResult> {
		let baseQb = executor
			.selectFrom("videos")
			.leftJoin("videoInfos", "videoInfos.videoId", "videos.id")

		if (query.status) {
			baseQb = baseQb.where("videos.status", "=", query.status)
		}

		const searchPattern = query.q
			? `%${this.escapeLikePattern(query.q)}%`
			: null
		const searchVideoId =
			query.q && this.isVideoUuidV7(query.q) ? query.q : null

		if (searchPattern || searchVideoId) {
			baseQb = baseQb.where((eb) =>
				eb.or([
					...(searchVideoId ? [eb("videos.id", "=", searchVideoId)] : []),
					...(searchPattern
						? [
								sql<boolean>`${sql.ref("videos.externalId")} ilike ${searchPattern} escape '\\'`,
								sql<boolean>`${sql.ref("videoInfos.fulltitle")} ilike ${searchPattern} escape '\\'`,
								sql<boolean>`${sql.ref("videoInfos.channelTitle")} ilike ${searchPattern} escape '\\'`,
							]
						: []),
				])
			)
		}

		const countRow = await baseQb
			.select(
				sql<string>`count(distinct ${sql.ref("videos.id")})`.as("rowCount")
			)
			.executeTakeFirstOrThrow()
		const rowCount = Number.parseInt(countRow.rowCount, 10)

		const rows = await baseQb
			.selectAll("videos")
			.orderBy(listSortColumns[query.sortBy], query.sortDir)
			.orderBy("videos.id", "asc")
			.limit(query.pageSize)
			.offset(query.pageIndex * query.pageSize)
			.execute()

		return {
			items: rows.map((row) => this.toDomain(row)),
			rowCount,
		}
	}

	private isVideoUuidV7(input: string) {
		return videoSchema.shape.id.safeParse(input).success
	}

	private escapeLikePattern(input: string): string {
		return input
			.replaceAll("\\", "\\\\")
			.replaceAll("%", "\\%")
			.replaceAll("_", "\\_")
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
