import { sql } from "kysely"
import type { DB } from "../database.module"

export async function pingDatabase(db: DB) {
	try {
		const row = await db
			.selectNoFrom(sql<{ current_time: Date }>`now()`.as("currentTime"))
			.executeTakeFirst()

		console.log("[db] Current time:", row?.currentTime)
	} catch (error) {
		console.error("[db] Failed database ping:", error)
	}
}
