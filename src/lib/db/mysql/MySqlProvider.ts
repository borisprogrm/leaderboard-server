import log4js from "log4js";
const logger = log4js.getLogger('MySqlProvider');

import mysql from 'mysql2/promise';
import { IDbProvider, DBProviderConfig, TopData, UserData, UserProperties } from '../DbProvider.types.js';

export default class MySqlProvider implements IDbProvider {
	private pool: mysql.Pool | null;

	static DB_TABLE_NAME: string = 'UserData';

	constructor() {
		this.pool = null;
	}

	static FilterNullValues(dbData: object) {
		return Object.prototype.toString.call(dbData) === '[object Object]' ?
			Object.fromEntries(Object.entries(dbData).filter(([_, v]) => v != null)) : null;
	}

	/**
	 * @param {mysql.PoolOptions} config - Config passed to mysql.Pool constructor
	 */
	async Initialize(config: DBProviderConfig): Promise<void> {
		const {isDebug, ...dbConfig} = config; // eslint-disable-line @typescript-eslint/no-unused-vars
		this.pool = mysql.createPool(dbConfig as mysql.PoolOptions);

		// Try connecting to check the availability of db
		const conn = await this.pool.getConnection();
		this.pool.releaseConnection(conn);

		logger.debug('DB provider initialized');
	}

	async Put(gameId: string, userId: string, userProp: UserProperties): Promise<void> {
		await this.pool!.query(
			`INSERT INTO ${MySqlProvider.DB_TABLE_NAME} VALUES (?, ?, ?, ?, ?) AS new\
			ON DUPLICATE KEY UPDATE \
				score = new.score, name = new.name, params = new.params`,
			[gameId, userId, userProp.score, userProp.name, userProp.params],
		);
	}

	async Delete(gameId: string, userId: string): Promise<void> {
		await this.pool!.query(
			`DELETE FROM ${MySqlProvider.DB_TABLE_NAME} WHERE gameId = ? AND userId = ?`,
			[gameId, userId],
		);
	}

	async Get(gameId: string, userId: string): Promise<UserProperties | null> {
		const [dbData] = await this.pool!.query(
			`SELECT score, name, params FROM ${MySqlProvider.DB_TABLE_NAME} WHERE gameId = ? AND userId = ?`,
			[gameId, userId],
		);

		return Array.isArray(dbData) ?
			MySqlProvider.FilterNullValues(dbData[0]) as UserProperties : null;
	}

	async Top(gameId: string, nTop: number): Promise<TopData> {
		const [topData] = await this.pool!.query(
			`SELECT userId as "userId", score, name, params FROM ${MySqlProvider.DB_TABLE_NAME} \
				WHERE gameId = ? ORDER BY gameId ASC, score DESC LIMIT ?`,
			[gameId, nTop]
		);
		if (!Array.isArray(topData) || !topData.length) {
			return [];
		}

		const top: TopData = topData.map((data) => MySqlProvider.FilterNullValues(data) as UserData);
		return top;
	}

	async Shutdown(): Promise<void> {
		await this.pool?.end();
		logger.debug('DB provider shutdown');
	}
}
