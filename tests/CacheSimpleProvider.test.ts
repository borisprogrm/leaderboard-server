import { jest } from '@jest/globals';
import CacheSimpleProvider from '../src/lib/cache/simple/CacheSimpleProvider';
import DbInMemoryProvider from '../src/lib/db/inmemory/DbInMemoryProvider';
import { TopData } from '../src/lib/cache/CacheProvider.types';
import { UserData } from '../src/lib/db/DbProvider.types';

describe('CacheSimpleProvider', () => {
	const now = Date.now();
	let cacheProvider: CacheSimpleProvider;
	let dbProvider: DbInMemoryProvider;
	let spyDb: jest.SpiedFunction<(gameId: string, nTop: number) => Promise<TopData>>;

	const TTL = 1000;
	const gameId1 = 'game1';
	const gameId2 = 'game2';

	beforeEach(async () => {
		cacheProvider = new CacheSimpleProvider();
		dbProvider = new DbInMemoryProvider();
		await cacheProvider.Initialize({ isDebug: true, ttl: TTL }, dbProvider);
		spyDb = jest.spyOn(dbProvider, 'Top');
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.useRealTimers();
	})

	test('get empty top data', async () => {
		const top = await cacheProvider.Top(gameId1, 10);
		expect(spyDb).toHaveBeenCalledTimes(1);
		expect(top).toEqual([]);

		let tops: Array<TopData>;
		spyDb.mockClear();
		tops = await Promise.all([cacheProvider.Top(gameId2, 10), cacheProvider.Top(gameId2, 8)]);
		expect(spyDb).toHaveBeenCalledTimes(1);
		expect(tops).toEqual([[], []]);

		spyDb.mockClear();
		tops = await Promise.all([cacheProvider.Top(gameId2, 20), cacheProvider.Top(gameId2, 100)]);
		expect(spyDb).toHaveBeenCalledTimes(2);
		expect(tops).toEqual([[], []]);
	});

	test('get top data', async () => {
		const user1: UserData = { userId: 'user1', name: 'Jack', score: 84, params: 'some_payload_1' };
		const user2: UserData = { userId: 'user2', score: 52, params: 'some_payload_2' };
		const user3: UserData = { userId: 'user3', name: 'Tom', score: 31 };

		for (const u of [user1, user2, user3]) {
			await dbProvider.Put(gameId1, u.userId, { score: u.score, name: u.name, params: u.params });
		}

		jest.useFakeTimers({ now: now });

		let top: TopData;
		top = await cacheProvider.Top(gameId1, 10);
		expect(spyDb).toHaveBeenCalledTimes(1);
		expect(top).toEqual([user1, user2, user3]);

		spyDb.mockClear();
		top = await cacheProvider.Top(gameId1, 2);
		expect(spyDb).toHaveBeenCalledTimes(0);
		expect(top).toEqual([user1, user2]);

		jest.useFakeTimers({ now: now + (TTL - 1) });
		spyDb.mockClear();
		await dbProvider.Put(gameId1, user3.userId, { score: 150, name: user3.name, params: user3.params });
		top = await cacheProvider.Top(gameId1, 10);
		expect(spyDb).toHaveBeenCalledTimes(0);
		expect(top).toEqual([user1, user2, user3]);

		jest.useFakeTimers({ now: now + TTL });
		spyDb.mockClear();
		top = await cacheProvider.Top(gameId1, 10);
		expect(spyDb).toHaveBeenCalledTimes(1);
		(user3 as { score: number }).score = 150;
		expect(top).toEqual([user3, user1, user2]);
	});

});