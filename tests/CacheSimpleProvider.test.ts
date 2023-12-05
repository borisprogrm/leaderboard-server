import {jest} from '@jest/globals';
import CacheSimpleProvider from '../src/lib/cache/simple/CacheSimpleProvider';
import { TopData } from '../src/lib/cache/CacheProvider.types';

describe('CacheSimpleProvider', () => {
	const now = Date.now();
	let cacheProvider: CacheSimpleProvider;
	const topData: TopData = [
		{ userId: 'user1', name: 'Jack', score: 84, params: 'some_payload_1' },
		{ userId: 'user2', name: 'Marry', score: 52, params: 'some_payload_2' },
		{ userId: 'user3', name: 'Tom', score: 31, params: 'some_payload_3' },
	];

	beforeEach(async () => {
		cacheProvider = new CacheSimpleProvider();
		await cacheProvider.Initialize({ isDebug: true, ttl: 10000 });
	});

	afterEach(() => {
		jest.useRealTimers();
	})

	test('get empty top data', async () => {
		let top: TopData | null;

		top = await cacheProvider.Get('game1', 10);
		expect(top).toBeNull();

		top = await cacheProvider.Get('game2', 10);
		expect(top).toBeNull();
	});

	test('set and get top data', async () => {
		let top: TopData | null;

		jest.useFakeTimers({ now: now });
		await cacheProvider.Set('game1', topData);
		top = await cacheProvider.Get('game1', 10);
		expect(top).toEqual(topData);

		jest.useFakeTimers({ now: now + 5000 });
		top = await cacheProvider.Get('game1', 10);
		expect(top).toEqual(topData);

		jest.useFakeTimers({ now: now + 12000 });
		top = await cacheProvider.Get('game1', 10);
		expect(top).toBeNull();
	});

});