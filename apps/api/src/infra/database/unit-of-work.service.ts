import { Injectable } from "@nestjs/common"
import { Transaction } from "kysely"
import { DB } from "./generated-db-types"
import { InjectDb } from "./inject.decorator"

@Injectable()
export class UowService {
	constructor(@InjectDb() private readonly db: InjectDb.Client) {}

	async run<T>(fn: (trx: Transaction<DB>) => Promise<T>): Promise<T> {
		return this.db.transaction().execute(async (trx) => {
			return fn(trx)
		})
	}
}
