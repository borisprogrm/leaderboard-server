import { jest } from '@jest/globals';

import * as mongodb from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

import MongoProvider from '../src/lib/db/mongodb/MongoProvider';
import { TopData, UserProperties } from '../src/lib/db/DbProvider.types';

describe('MongoProvider', () => {
	let dbMock: MongoMemoryServer;
	let dbProvider: MongoProvider;

	// A little trick to map MongoDB Shell commands => Node.js Driver commands for db setup script
	class MShellDbMock {
		constructor(private db: mongodb.Db) {
			this.db = db;
		}
		
		public createCollection<TSchema extends Document = Document>(name: string, options?: mongodb.CreateCollectionOptions): Promise<mongodb.Collection<TSchema>> {
			return this.db.createCollection(name, options);
		}
	
		public getCollection<TSchema extends Document = Document>(name: string, options?: mongodb.CollectionOptions): mongodb.Collection<TSchema> {
			return this.db.collection(name, options);
		}
	}

	class MShellMock {	
		public getDB(name: string): MShellDbMock {
			return new MShellDbMock(dbProvider['mongo']!.db(name));
		}
	}
	// ----------------------------------------------------------------------

	const gameId = 'game101';
	const userId1 = 'user1';
	const userId2 = 'user2';

	const userProp1: UserProperties = {
		name: 'Ted',
		score: 11,
		params: 'some_payload_1',
	};
	const userProp2: UserProperties = {
		name: 'Jane',
		score: 56,
	};
	const topData: TopData = [{ ...userProp2, userId: userId2 }, { ...userProp1, userId: userId1 }];

	beforeAll(async () => {
		dbMock = await MongoMemoryServer.create();
		dbProvider = new MongoProvider();

		await dbProvider.Initialize({
			isDebug: true,
			url: dbMock.getUri(),
		});

		(global as {[key: string]: unknown}).Mongo = MShellMock; // Have to use global
		const { default: SetupDB } = await import('../src/lib/db/mongodb/setup.mongodb.cjs');
		await SetupDB();
	}, 10000)

	afterAll(async () => {
		await dbProvider.Shutdown();
		await dbMock.stop();
		jest.restoreAllMocks();
	}, 10000);

	test('get empty data', async () => {
		const data = await dbProvider.Get(gameId, userId1);
		expect(data).toBeNull();
	});

	test('set, get and delete data', async () => {
		let data: UserProperties | null;

		await dbProvider.Put(gameId, userId1, userProp1);
		data = await dbProvider.Get(gameId, userId1);
		expect(data).toEqual(userProp1);

		const userProp1Mod = {...userProp1, score: 33};
		await dbProvider.Put(gameId, userId1, userProp1Mod);
		data = await dbProvider.Get(gameId, userId1);
		expect(data).toEqual(userProp1Mod);

		await dbProvider.Delete(gameId, userId1);
		data = await dbProvider.Get(gameId, userId1);
		expect(data).toBeNull();
	});

	test('get top data', async () => {
		let top: TopData;

		top = await dbProvider.Top(gameId, 10);
		expect(top).toEqual([]);

		await dbProvider.Put(gameId, userId1, userProp1);
		await dbProvider.Put(gameId, userId2, userProp2);

		top = await dbProvider.Top(gameId, 10);
		expect(top).toEqual(topData);
	});

});