import log4js from 'log4js';
const logger = log4js.getLogger('DbInMemoryProvider');

import { IDbProvider, DBProviderConfig, TopData, UserProperties } from '../DbProvider.types';

export default class DbInMemoryProvider implements IDbProvider {
	private readonly data: Map<string, Map<string, UserProperties>>;

	constructor() {
		this.data = new Map();
	}

	async Initialize(config: DBProviderConfig): Promise<void> {
		if (!config.isDebug) {
			logger.warn('DbInMemoryProvider should only be used for testing purposes only!');
		}
		logger.debug('DB provider initialized');
	}

	async Put(gameId: string, userId: string, userProp: UserProperties): Promise<void> {
		if (!this.data.has(gameId)) {
			this.data.set(gameId, new Map());
		}
		this.data.get(gameId)?.set(userId, userProp);
	}

	async Delete(gameId: string, userId: string): Promise<void> {
		this.data.get(gameId)?.delete(userId);
	}

	async Get(gameId: string, userId: string): Promise<UserProperties | null> {
		return this.data.get(gameId)?.get(userId) ?? null;
	}

	async Top(gameId: string, nTop: number): Promise<TopData> {
		const gameData = this.data.get(gameId);
		if (!gameData) {
			return [];
		}
		return Array.from(gameData).sort((a, b) => b[1].score - a[1].score).slice(0, nTop).map(e => ({ ...{ userId: e[0] }, ...e[1] }));
	}

	async Shutdown(): Promise<void> {
		/* do nothing */
		logger.debug('DB provider shutdown');
	}
}
