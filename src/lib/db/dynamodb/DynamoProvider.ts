import log4js from "log4js";
const logger = log4js.getLogger('DynamoProvider');

import * as crypto from 'crypto';

import { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { IDbProvider, DBProviderConfig, TopData, UserProperties } from '../DbProvider.types';

type UserDbProperties = {
	gId: string,
	uId: string,
	sc: number,
	nm?: string,
	pl?: string,
};

export default class DynamoProvider implements IDbProvider {
	private dbClient: DynamoDBClient | null;
	private dbDocClient: DynamoDBDocumentClient | null;

	private nShards: number;

	static DBTABLE_NAME: string = 'Leaderboard';
	static DBTABLE_INDEX_NAME: string = 'ScoreIndex';

	constructor() {
		this.dbClient = null;
		this.dbDocClient = null;
		this.nShards = 0;
	}

	static GetHashKey(gameId: string, userId: string, nShards: number): string {
		const shard = nShards > 1 ? (crypto.createHash('sha1').update(userId).digest().readUInt32BE(16) % nShards) : 0;
		const key = `${gameId}:${shard}`;
		return key;
	}

	/**
	 * @param {Object} config 
	 * @param {Object} config.client - Config passed to DynamoDBClient
	 * @param {number} config.nShards - Number of custom shards used to avoid "hot" partition problem (1-100)
	 */
	async Initialize(config: DBProviderConfig): Promise<void> {
		if (!Number.isInteger(config.nShards) || (config.nShards as number) < 1 || (config.nShards as number) > 100) {
			throw new Error('Wrong parameter nShards');
		}
		this.nShards = config.nShards as number;

		this.dbClient = new DynamoDBClient(config.client as DynamoDBClientConfig);
		this.dbDocClient = DynamoDBDocumentClient.from(this.dbClient);

		logger.debug('DB provider initialized');
	}

	async Put(gameId: string, userId: string, userProp: UserProperties): Promise<void> {
		const dbItem: UserDbProperties = {
			gId: DynamoProvider.GetHashKey(gameId, userId, this.nShards),
			uId: userId,
			sc: userProp.score,
			nm: userProp.name,
			pl: userProp.params,
		}

		await this.dbDocClient?.send(new PutCommand({
			TableName: DynamoProvider.DBTABLE_NAME,
			Item: dbItem,
		}));
	}

	async Delete(gameId: string, userId: string): Promise<void> {
		await this.dbDocClient?.send(new DeleteCommand({
			TableName: DynamoProvider.DBTABLE_NAME,
			Key: {
				gId: DynamoProvider.GetHashKey(gameId, userId, this.nShards),
				uId: userId,
			},
		}));
	}

	async Get(gameId: string, userId: string): Promise<UserProperties | null> {
		const res = await this.dbDocClient?.send(new GetCommand({
			TableName: DynamoProvider.DBTABLE_NAME,
			Key: {
				gId: DynamoProvider.GetHashKey(gameId, userId, this.nShards),
				uId: userId,
			},
			ConsistentRead: true, // this can actually be skipped if necessary (lower cost)
		}));

		const item = res?.Item;
		if (!item) {
			return null;
		}

		const userData: UserProperties = {
			score: (item as UserDbProperties).sc,
			name: (item as UserDbProperties).nm,
			params: (item as UserDbProperties).pl,
		}
		return userData;
	}

	async Top(gameId: string, nTop: number): Promise<TopData> {
		const queries = new Array(this.nShards).fill(null).map((_e, idx) => this.dbDocClient?.send(new QueryCommand({
			TableName: DynamoProvider.DBTABLE_NAME,
			IndexName: DynamoProvider.DBTABLE_INDEX_NAME,
			KeyConditionExpression: 'gId = :gId',
			ExpressionAttributeValues: {
				':gId': `${gameId}:${idx}`,
			},
			ScanIndexForward: false,
			Limit: nTop,
		})));

		const res = await Promise.all(queries);
		const items = res.map(e => e && Array.isArray(e.Items) ? e.Items : []).flat();
		items.sort((a, b) => (b as UserDbProperties).sc - (a as UserDbProperties).sc);

		const N = Math.min(items.length, nTop);
		const top: TopData = Array(N);
		for (let i = 0; i < N; i++) {
			const item = items[i] as UserDbProperties;
			top[i] = {
				userId: item.uId,
				score: item.sc,
				name: item.nm,
				params: item.pl,
			};
		}

		return top;
	}

	async Shutdown(): Promise<void> {
		this.dbClient?.destroy();
		logger.debug('DB provider shutdown');
	}
}
