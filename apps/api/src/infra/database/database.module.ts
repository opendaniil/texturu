import { Global, Module } from "@nestjs/common"
import { Kysely } from "kysely"
import { dbProvider } from "./database.provider"
import { DatabaseService } from "./database.service"
import { DB_TOKEN } from "./database.tokens"
import type { DB as GenDb } from "./generated-db-types"
import { UowService } from "./unit-of-work.service"

export type Database = GenDb
export type DB = Kysely<GenDb>

@Global()
@Module({
	providers: [dbProvider, DatabaseService, UowService],
	exports: [DB_TOKEN, DatabaseService, UowService],
})
export class DatabaseModule {}
