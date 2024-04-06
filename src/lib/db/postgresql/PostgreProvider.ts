import log4js from 'log4js';
const logger = log4js.getLogger('PostgreProvider');

import pg from 'pg';
const { Pool } = pg;
import { IDbProvider, DBProviderConfig, TopData, UserData, UserProperties } from '../DbProvider.types';

export default class PostgreProvider implements IDbProvider {
	private pool: pg.Pool | null;

	static DB_TABLE_NAME: string = 'UserData';

	constructor() {
		this.pool = null;
	}

	static FilterNullValues(dbData: object) {
		return Object.prototype.toString.call(dbData) === '[object Object]' ?
			Object.fromEntries(Object.entries(dbData).filter(([_, v]) => v != null)) : null;
	}

	/**
	 * @param {pg.PoolConfig} config - Config passed to pg.Pool constructor
	 */
	async Initialize(config: DBProviderConfig): Promise<void> {
		this.pool = new Pool(config as pg.PoolConfig);

		this.pool.on('error', (err, _client) => {
			logger.error('PostgreSQL error event', err);
		});

		// Try connecting to check the availability of db
		const client = await this.pool.connect();
		client.release();

		logger.debug('DB provider initialized');
	}

	async Put(gameId: string, userId: string, userProp: UserProperties): Promise<void> {
		await this.pool!.query(
			`INSERT INTO ${PostgreProvider.DB_TABLE_NAME} VALUES ($1, $2, $3, $4, $5) \
				ON CONFLICT(gameId, userId) DO UPDATE SET \
				score = EXCLUDED.score, name = EXCLUDED.name, params = EXCLUDED.params`,
			[gameId, userId, userProp.score, userProp.name, userProp.params],
		);
	}

	async Delete(gameId: string, userId: string): Promise<void> {
		await this.pool!.query(
			`DELETE FROM ${PostgreProvider.DB_TABLE_NAME} WHERE gameId = $1 AND userId = $2`,
			[gameId, userId],
		);
	}

	async Get(gameId: string, userId: string): Promise<UserProperties | null> {
		const dbData = await this.pool!.query(
			`SELECT score, name, params FROM ${PostgreProvider.DB_TABLE_NAME} WHERE gameId = $1 AND userId = $2`,
			[gameId, userId],
		);

		return Array.isArray(dbData?.rows) ?
			PostgreProvider.FilterNullValues(dbData.rows[0]) as UserProperties : null;
	}

	async Top(gameId: string, nTop: number): Promise<TopData> {
		const topData = await this.pool!.query(
			`SELECT userId as "userId", score, name, params FROM ${PostgreProvider.DB_TABLE_NAME} \
				WHERE gameId = $1 ORDER BY gameId ASC, score DESC LIMIT $2`,
			[gameId, nTop]
		);
		if (!Array.isArray(topData?.rows) || !topData.rows.length) {
			return [];
		}

		const top: TopData = topData.rows.map((data) => PostgreProvider.FilterNullValues(data) as UserData);
		return top;
	}

	async Shutdown(): Promise<void> {
		await this.pool?.end();
		logger.debug('DB provider shutdown');
	}
}
