import fs from 'fs';
import { GenericContainer, Wait, StartedTestContainer } from 'testcontainers';

import MongoProvider from '../src/lib/db/mongodb/MongoProvider';
import { TopData, UserProperties } from '../src/lib/db/DbProvider.types';

describe('MongoProvider', () => {
	let mongoContainer: StartedTestContainer;
	let dbProvider: MongoProvider;

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
		mongoContainer = await new GenericContainer('mongo:7.0.4')
			.withExposedPorts(27017)
			.withCopyContentToContainer([{
				content: fs.readFileSync('./src/lib/db/mongodb/setup.mongodb.js'),
				target: '/docker-entrypoint-initdb.d/mongo-init.js',
			}])
			.withWaitStrategy(Wait.forListeningPorts())
			.start();

		dbProvider = new MongoProvider();

		await dbProvider.Initialize({
			isDebug: true,
			url: `mongodb://localhost:${mongoContainer.getMappedPort(27017)}`,
		});
	}, 100000)

	afterAll(async () => {
		await dbProvider.Shutdown();
		await mongoContainer.stop();
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

		const userProp1Mod = { ...userProp1, score: 33 };
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