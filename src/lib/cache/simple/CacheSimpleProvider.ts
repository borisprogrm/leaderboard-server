import log4js from "log4js";
const logger = log4js.getLogger('CacheSimpleProvider');

import { ICacheProvider, IDbProvider, CacheProviderConfig, CacheData, TopData } from '../CacheProvider.types.js';

export default class CacheSimpleProvider implements ICacheProvider {
	private readonly cache: Map<string, CacheData>;
	private dbProvider: IDbProvider | null;
	private ttl: number;

	constructor() {
		this.cache = new Map();
		this.dbProvider = null;
		this.ttl = 0;
	}

	async Initialize(config: CacheProviderConfig, dbProvider: IDbProvider): Promise<void> {
		this.ttl = config.ttl;
		this.dbProvider = dbProvider;
		logger.debug('Cache provider initialized');
	}

	async Top(gameId: string, nTop: number): Promise<TopData> {
		if (!this.dbProvider) {
			throw new Error('Uninitialized')
		}

		const now = Date.now();
		let topPromise: Promise<TopData>;

		const cacheData = this.cache.get(gameId);
		if (cacheData && cacheData.exp > now && cacheData.cnt >= nTop) {
			topPromise = cacheData.promise;
		}
		else {
			topPromise = this.dbProvider.Top(gameId, nTop)
				.catch((err) => {
					this.cache.delete(gameId);
					return Promise.reject(err);
				});
			this.cache.set(gameId, {
				exp: now + this.ttl,
				cnt: nTop,
				promise: topPromise,
			});
		}

		const topData = await topPromise;
		return topData.length <= nTop ? topData : topData.slice(0, nTop);
	}

	async Shutdown(): Promise<void> {
		/* do nothing */
		logger.debug('Cache provider shutdown');
	}

}
