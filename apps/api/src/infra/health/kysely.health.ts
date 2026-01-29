import { Injectable } from "@nestjs/common"
import { HealthIndicatorService } from "@nestjs/terminus"
import { sql } from "kysely"
import { InjectDb } from "../database/inject.decorator"

@Injectable()
export class KyselyHealthIndicator {
	constructor(
		@InjectDb() private readonly db: InjectDb.Client,
		private readonly his: HealthIndicatorService
	) {}

	async isHealthy(key = "database", timeoutMs = 1500) {
		const indicator = this.his.check(key)

		const ping = this.db
			.selectNoFrom(sql<{ current_time: Date }>`now()`.as("current_time"))
			.executeTakeFirst()

		const timeout = new Promise((_, reject) =>
			setTimeout(
				() => reject(new Error(`DB ping timeout after ${timeoutMs}ms`)),
				timeoutMs
			)
		)

		try {
			await Promise.race([ping, timeout])
			return indicator.up()
		} catch (e) {
			return indicator.down({ message: (e as Error)?.message })
		}
	}
}
