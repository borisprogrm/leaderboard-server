import log4js from "log4js";
const logger = log4js.getLogger('LeaderboardService');

import { IConfig } from '../Config.js';

import { IDbProvider, TopData, UserProperties } from './db/DbProvider.types.js';
import { ICacheProvider } from './cache/CacheProvider.types.js';
import { DbProvidersIndex } from './db/index.js';
import { CacheProvidersIndex } from './cache/index.js';

export class LeaderboardService {
	private readonly config: IConfig;
	private dbProvider: IDbProvider | null;
	private cacheProvider: ICacheProvider | null;

	constructor(config: IConfig) {
		this.config = config;
		this.dbProvider = null;
		this.cacheProvider = null;
	}

	async Initialize(): Promise<void> {
		const dbProviderConfig = this.config.db.config;
		const { default: dbProviderClass } = await import(`./db/${DbProvidersIndex[this.config.db.providerType]}`);
		this.dbProvider = new dbProviderClass();

		const cacheProviderConfig = this.config.cache.config;
		const { default: cacheProviderClass } = await import(`./cache/${CacheProvidersIndex[this.config.cache.providerType]}`);
		this.cacheProvider = new cacheProviderClass();

		this.dbProvider?.Initialize({ ...{ isDebug: this.config.isDebug }, ...dbProviderConfig });
		this.cacheProvider?.Initialize({ ...{ isDebug: this.config.isDebug }, ...cacheProviderConfig });

		logger.debug('Leaderboard service initialized');
	}

	async PutUserScore(gameId: string, userId: string, userProp: UserProperties): Promise<void> {
		return this.dbProvider?.Put(gameId, userId, userProp);
	}

	async DeleteUserScore(gameId: string, userId: string): Promise<void> {
		return this.dbProvider?.Delete(gameId, userId);
	}

	async GetUserScore(gameId: string, userId: string): Promise<UserProperties | null> {
		return this.dbProvider?.Get(gameId, userId) ?? null;
	}

	async GetTop(gameId: string, nTop: number): Promise<TopData> {
		let topData = await this.cacheProvider?.Get(gameId, nTop);
		if (topData) {
			return topData;
		}

		topData = await this.dbProvider?.Top(gameId, nTop);
		if (!topData) {
			return [];
		}
		
		await this.cacheProvider?.Set(gameId, topData);
		return topData;
	}

	async Shutdown(): Promise<unknown> {
		return Promise.all([
			this.dbProvider?.Shutdown(),
			this.cacheProvider?.Shutdown(),
		]);
	}

}
