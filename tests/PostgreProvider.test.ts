import fs from 'fs';
import { GenericContainer, StartedTestContainer } from 'testcontainers';

import PostgreProvider from '../src/lib/db/postgresql/PostgreProvider';
import { TopData, UserProperties } from '../src/lib/db/DbProvider.types';

describe('PostgreProvider', () => {
	let pgContainer: StartedTestContainer;
	let dbProvider: PostgreProvider;

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
		const POSTGRES_USER = 'admin';
		const POSTGRES_PASSWORD = 'admpass';
		const POSTGRES_DB = 'Leaderboard';

		pgContainer = await new GenericContainer('postgres:16.1')
		.withExposedPorts(5432)
		.withEnvironment({
			POSTGRES_USER: POSTGRES_USER,
			POSTGRES_PASSWORD: POSTGRES_PASSWORD,
			POSTGRES_DB: POSTGRES_DB
		})
		.start();

		dbProvider = new PostgreProvider();
		await dbProvider.Initialize({
			isDebug: true,
			host: '127.0.0.1',
			port: pgContainer.getMappedPort(5432),
			database: POSTGRES_DB,
			user: POSTGRES_USER,
			password: POSTGRES_PASSWORD,
		});
		
		// Create db tables and indexes
		await dbProvider['pool']!.query(fs.readFileSync('./src/lib/db/postgresql/dbSetup.sql', 'utf-8'));
	}, 60000);

	afterAll(async () => {
		await dbProvider.Shutdown();
		await pgContainer.stop();
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