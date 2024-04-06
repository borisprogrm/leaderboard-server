import { Injectable, Inject, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import log4js from 'log4js';

import { CONFIG_PROVIDER, DB_PROVIDER, CACHE_PROVIDER } from '../constants';
import { IConfig } from '../Config.types';
import { IDbProvider, TopData, UserProperties } from './db/DbProvider.types';
import { ICacheProvider } from './cache/CacheProvider.types';

@Injectable()
export class LeaderboardService implements OnModuleInit, OnApplicationShutdown {
	private readonly logger = log4js.getLogger(LeaderboardService.name);
	private readonly config: IConfig;
	private readonly dbProvider: IDbProvider;
	private readonly cacheProvider: ICacheProvider;

	constructor(
		@Inject(CONFIG_PROVIDER) config: IConfig,
		@Inject(DB_PROVIDER) dbProvider: IDbProvider,
		@Inject(CACHE_PROVIDER) cacheProvider: ICacheProvider,
	) {
		this.config = config;
		this.dbProvider = dbProvider;
		this.cacheProvider = cacheProvider;
	}

	async onModuleInit(): Promise<void> {
		const dbProviderConfig = this.config.db.config;
		await this.dbProvider.Initialize({ ...{ isDebug: this.config.isDebug }, ...dbProviderConfig });

		const cacheProviderConfig = this.config.cache.config;
		await this.cacheProvider.Initialize({ ...{ isDebug: this.config.isDebug }, ...cacheProviderConfig }, this.dbProvider as IDbProvider);

		this.logger.debug('Leaderboard service initialized');
	}

	async onApplicationShutdown(signal: string) {
		this.logger.debug('Leaderboard service shutdown');
		await this.Shutdown();
	}

	async PutUserScore(gameId: string, userId: string, userProp: UserProperties): Promise<void> {
		return this.dbProvider.Put(gameId, userId, userProp);
	}

	async DeleteUserScore(gameId: string, userId: string): Promise<void> {
		return this.dbProvider.Delete(gameId, userId);
	}

	async GetUserScore(gameId: string, userId: string): Promise<UserProperties | null> {
		return this.dbProvider.Get(gameId, userId) ?? null;
	}

	async GetTop(gameId: string, nTop: number): Promise<TopData> {
		return this.cacheProvider.Top(gameId, nTop) ?? [];
	}

	async Shutdown(): Promise<unknown> {
		return Promise.all([
			this.dbProvider.Shutdown(),
			this.cacheProvider.Shutdown(),
		]);
	}
}
