import log4js from "log4js";
const logger = log4js.getLogger('CacheSimpleProvider');

import {ICacheProvider, CacheProviderConfig, CacheData, TopData} from '../CacheProvider.types.js';

export default class CacheSimpleProvider implements ICacheProvider {
	private readonly cache: Map<string, CacheData>;
	private ttl: number;

	constructor() {
		this.cache = new Map();
		this.ttl = 0;
	}

	async Initialize(config: CacheProviderConfig): Promise<void> {
		this.ttl = config.ttl;
		logger.debug('Cache provider initialized');
	}

	async Get(gameId: string, nTop: number): Promise<TopData | null> {
		const now = Date.now();
		const cacheData = this.cache.get(gameId);
		return cacheData && cacheData[0] > now ? cacheData[1].slice(0, nTop) : null;
	}

	async Set(gameId: string, topData: TopData): Promise<void> {
		const now = Date.now();
		this.cache.set(gameId, [now + this.ttl, topData]);
	}

	async Shutdown(): Promise<void> {
		/* do nothing */
		logger.debug('Cache provider shutdown');
	}
}
