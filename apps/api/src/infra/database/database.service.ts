import {
	Inject,
	Injectable,
	type OnModuleDestroy,
	type OnModuleInit,
} from "@nestjs/common"
import { AppConfigService } from "../app-config/app-config.service"
import type { DB } from "./database.module"
import { DB_TOKEN } from "./database.tokens"
import { pingDatabase } from "./tasks/ping"

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
	constructor(
		@Inject(DB_TOKEN) public readonly db: DB,
		@Inject(AppConfigService) private readonly config: AppConfigService
	) {}

	async onModuleInit() {
		if (!this.config.isProd) {
			await pingDatabase(this.db)
		}
	}

	async onModuleDestroy() {
		await this.db.destroy()
	}
}
