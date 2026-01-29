import { Global, Module } from "@nestjs/common"
import { Kysely } from "kysely"
import { dbProvider } from "./database.provider"
import { DatabaseService } from "./database.service"
import { DB_TOKEN } from "./database.tokens"
import type { DB as Database } from "./generated-db-types"

export type DB = Kysely<Database>

@Global()
@Module({
	providers: [dbProvider, DatabaseService],
	exports: [DB_TOKEN, DatabaseService],
})
export class DatabaseModule {}
