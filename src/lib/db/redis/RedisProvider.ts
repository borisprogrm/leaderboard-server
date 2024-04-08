import log4js from "log4js";
const logger = log4js.getLogger('RedisProvider');

import { Redis, RedisOptions } from 'ioredis';
import { IDbProvider, DBProviderConfig, TopData, UserProperties } from '../DbProvider.types';

type UserHashProperties = {
	nm?: string,
	pl?: string,
};

export default class RedisProvider implements IDbProvider {
	private redis: Redis | null;

	constructor() {
		this.redis = null;
	}

	static GetUserKey(gameId: string, userId: string) {
		const key = `${gameId}:${userId}`;
		return key;
	}

	async Initialize(config: DBProviderConfig): Promise<void> {
		const redisConf: RedisOptions = { ...(config as RedisOptions), ...{ lazyConnect: true } };
		this.redis = new Redis(redisConf);

		this.redis?.on('connect', () => {
			logger.debug('Redis db connect event');
		});

		this.redis?.on('close', () => {
			logger.debug('Redis db close event');
		});

		this.redis?.on('error', (err) => {
			logger.error('Redis db error event', err);
		});

		await this.redis?.connect();

		logger.debug('DB provider initialized');
	}

	async Put(gameId: string, userId: string, userProp: UserProperties): Promise<void> {
		if (userProp.name || userProp.params) {
			const hashProp: UserHashProperties = {};
			if (userProp.name) {
				hashProp.nm = userProp.name;
			}
			if (userProp.params) {
				hashProp.pl = userProp.params;
			}
			await this.redis?.hset(RedisProvider.GetUserKey(gameId, userId), hashProp);
		}
		await this.redis?.zadd(gameId, userProp.score, userId);
	}

	async Delete(gameId: string, userId: string): Promise<void> {
		await this.redis?.zrem(gameId, userId);
		await this.redis?.del(RedisProvider.GetUserKey(gameId, userId));
	}

	async Get(gameId: string, userId: string): Promise<UserProperties | null> {
		const [score, params] = await Promise.all([
			this.redis?.zscore(gameId, userId),
			this.redis?.hgetall(RedisProvider.GetUserKey(gameId, userId))
		]);
		if (score == null) {
			return null;
		}

		const userData: UserProperties = {
			score: Number(score),
			name: params?.nm,
			params: params?.pl,
		}
		return userData;
	}

	async Top(gameId: string, nTop: number): Promise<TopData> {
		const topData = await this.redis?.zrange(gameId, 0, nTop - 1, "REV", "WITHSCORES");
		if (!Array.isArray(topData) || !topData.length || topData.length % 2) {
			return [];
		}

		const N = topData.length;
		const rpipe = this.redis?.multi({ pipeline: true });
		for (let i = 0; i < N; i += 2) {
			rpipe?.hgetall(RedisProvider.GetUserKey(gameId, topData[i]));
		}
		const paramsData = await rpipe?.exec();
		if (!Array.isArray(paramsData) || paramsData.length !== N / 2) {
			throw new Error('Transaction discarded')
		}
		for (const res of paramsData) {
			if (!Array.isArray(res) || res[0] != null) {
				throw res[0];
			}
		}

		let i = 0;
		const top: TopData = paramsData.map((data) => ({
			userId: topData[i++],
			score: Number(topData[i++]),
			name: (data[1] as UserHashProperties).nm,
			params: (data[1] as UserHashProperties).pl,
		}));

		return top;
	}

	async Shutdown(): Promise<void> {
		await this.redis?.quit();
		logger.debug('DB provider shutdown');
	}
}
