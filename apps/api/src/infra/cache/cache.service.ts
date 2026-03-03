import { CACHE_MANAGER, type Cache } from "@nestjs/cache-manager"
import { Inject, Injectable } from "@nestjs/common"

const KEY_PREFIX = "cache:v1"

@Injectable()
export class CacheService {
	constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

	private buildKey(key: string): string {
		return `${KEY_PREFIX}:${key}`
	}

	getOrSet<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
		return this.cache.wrap(this.buildKey(key), fn, ttl)
	}

	del(key: string) {
		return this.cache.del(this.buildKey(key))
	}
}
