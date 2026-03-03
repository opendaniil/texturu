import KeyvRedis from "@keyv/redis"
import { CacheModule as NestCacheModule } from "@nestjs/cache-manager"
import { Global, Module } from "@nestjs/common"
import Keyv from "keyv"
import { AppConfigModule } from "../app-config/app-config.module"
import { AppConfigService } from "../app-config/app-config.service"
import { CacheService } from "./cache.service"

@Global()
@Module({
	imports: [
		NestCacheModule.registerAsync({
			imports: [AppConfigModule],
			inject: [AppConfigService],
			useFactory: (cfg: AppConfigService) => ({
				stores: [
					new Keyv({
						store: new KeyvRedis(
							`redis://${cfg.get("REDIS_HOST")}:${cfg.get("REDIS_PORT")}`
						),
					}),
				],
			}),
		}),
	],
	providers: [CacheService],
	exports: [NestCacheModule, CacheService],
})
export class CacheModule {}
