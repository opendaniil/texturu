import { Inject } from "@nestjs/common"
import { DB } from "./database.module"
import { DB_TOKEN } from "./database.tokens"

export const InjectDb = () => Inject(DB_TOKEN)

export namespace InjectDb {
	export type Client = DB
}
