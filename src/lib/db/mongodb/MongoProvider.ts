import log4js from "log4js";
const logger = log4js.getLogger('MongoProvider');

import { MongoClient, Db, Collection, Document, MongoClientOptions, ObjectId } from 'mongodb';
import { IDbProvider, DBProviderConfig, TopData, UserProperties } from '../DbProvider.types.js';

type UserCollectionCustomId = {
	gId: string,
	uId: string,
};

type UserCollectionData = {
	sc: number,
	nm?: string,
	pl?: string,
};

type UserCollectionDataWithId = {
	_id: UserCollectionCustomId | ObjectId
} & UserCollectionData;

export default class MongoProvider implements IDbProvider {
	private mongo: MongoClient | null;
	private db: Db | null;
	private collection: Collection<Document> | null;

	static DB_NAME: string = 'Leaderboard';
	static DB_COLLECTION_NAME: string = 'UserData';

	constructor() {
		this.mongo = null;
		this.db = null;
		this.collection = null;
	}

	/**
	 * @param {Object} config 
	 * @param {string} config.url - Url param passed to MongoClient constructor
	 * @param {MongoClientOptions} [config.options] - Options param passed to MongoClient constructor
	 */
	async Initialize(config: DBProviderConfig): Promise<void> {
		this.mongo = new MongoClient(config.url as string, config.options as MongoClientOptions);
		
		await this.mongo.connect();

		this.db = this.mongo.db(MongoProvider.DB_NAME);
		this.collection = this.db.collection(MongoProvider.DB_COLLECTION_NAME);

		logger.debug('DB provider initialized');
	}

	async Put(gameId: string, userId: string, userProp: UserProperties): Promise<void> {
		const dbData: UserCollectionData = {
			sc: userProp.score,
		};
		if (userProp.name) {
			dbData.nm = userProp.name;
		}
		if (userProp.params) {
			dbData.pl = userProp.params;
		}

		await this.collection!.replaceOne(
			{ _id: { gId: gameId, uId: userId } },
			dbData,
			{ upsert: true }
		);
	}

	async Delete(gameId: string, userId: string): Promise<void> {
		await this.collection!.deleteOne({ _id: { gId: gameId, uId: userId } });
	}

	async Get(gameId: string, userId: string): Promise<UserProperties | null> {
		const dbData = await this.collection!.find({ _id: {gId: gameId, uId: userId } }).next();
		if (dbData == null) {
			return null;
		}
		
		const userData: UserProperties = {
			score: (dbData as UserCollectionDataWithId).sc,
			name: (dbData as UserCollectionDataWithId).nm,
			params: (dbData as UserCollectionDataWithId).pl,
		}
		return userData;
	}

	async Top(gameId: string, nTop: number): Promise<TopData> {
		const topData = await this.collection!.find({ '_id.gId': gameId }, {hint: 'ScoreIndex'}).sort({ sc: -1 }).limit(nTop).toArray();
		if (!Array.isArray(topData) || !topData.length) {
			return [];
		}
		
		const top: TopData = topData.map((data) => ({
				userId: ((data as UserCollectionDataWithId)._id as UserCollectionCustomId).uId,
				score: (data as UserCollectionDataWithId).sc,
				name: (data as UserCollectionDataWithId).nm,
				params: (data as UserCollectionDataWithId).pl,
			}));

		return top;
	}

	async Shutdown(): Promise<void> {
		await this.mongo?.close();
		logger.debug('DB provider shutdown');
	}
}
