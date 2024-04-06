import fs from 'fs';
import { GenericContainer, Wait, StartedTestContainer } from 'testcontainers';

import MySqlProvider from '../src/lib/db/mysql/MySqlProvider';
import { TopData, UserProperties } from '../src/lib/db/DbProvider.types';

describe('MySqlProvider', () => {
	let mysqlContainer: StartedTestContainer;
	let dbProvider: MySqlProvider;

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
		const MYSQL_ROOT_PASSWORD = 'rootpass';
		const MYSQL_USER = 'test';
		const MYSQL_PASSWORD = 'test';
		const MYSQL_DATABASE = 'Leaderboard';

		mysqlContainer = await new GenericContainer('mysql:8.3.0')
		.withExposedPorts(3306)
		.withEnvironment({
			MYSQL_ROOT_PASSWORD: MYSQL_ROOT_PASSWORD,
			MYSQL_USER: MYSQL_USER,
			MYSQL_PASSWORD: MYSQL_PASSWORD,
			MYSQL_DATABASE: MYSQL_DATABASE
		})
		.withCopyContentToContainer([{
			content: fs.readFileSync('./src/lib/db/mysql/dbSetup.sql'),
			target: '/docker-entrypoint-initdb.d/init.sql',
		}])
		.withWaitStrategy(Wait.forListeningPorts())
		.start();

		dbProvider = new MySqlProvider();
		await dbProvider.Initialize({
			isDebug: true,
			host: '127.0.0.1',
			port: mysqlContainer.getMappedPort(3306),
			database: MYSQL_DATABASE,
			user: MYSQL_USER,
			password: MYSQL_PASSWORD,
		});
	}, 100000);

	afterAll(async () => {
		await dbProvider.Shutdown();
		await mysqlContainer.stop();
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