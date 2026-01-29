import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "./app-config.module"

@Injectable()
export class AppConfigService {
	constructor(private readonly config: ConfigService<EnvironmentVariables>) {}

	get<K extends keyof EnvironmentVariables>(key: K): EnvironmentVariables[K] {
		return this.config.getOrThrow(key)
	}

	get isProd(): boolean {
		return this.get("NODE_ENV") === "production"
	}
}
