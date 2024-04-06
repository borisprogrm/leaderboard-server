import { jest } from '@jest/globals';

import * as dynalite from "jest-dynalite";

import DynamoProvider from '../src/lib/db/dynamodb/DynamoProvider';
import { TopData, UserProperties } from '../src/lib/db/DbProvider.types';

describe('DynamoProvider', () => {
	let dbProvider: DynamoProvider;
	const gameId = 'game1';
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
		dynalite.setup('.');
		await dynalite.startDb();
		await dynalite.createTables();

		dbProvider = new DynamoProvider();
		await dbProvider.Initialize({
			isDebug: true,
			client: {
				endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
				apiVersion: '2012-08-10',
				credentials: {
					accessKeyId: 'none',
					secretAccessKey: 'none',
				},
				region: 'local',
			},
			nShards: 4,
		});
	})

	afterAll(async () => {
		await dbProvider.Shutdown();
		await dynalite.deleteTables();
		await dynalite.stopDb();
		jest.restoreAllMocks();
	});

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