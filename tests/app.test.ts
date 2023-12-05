import { jest } from '@jest/globals';
import server from '../src/app';
import request from 'supertest';

import { UserData } from '../src/lib/db/DbProvider.types';

const app = server.GetAppInstance();

async function ApiCall(route: string, params: object, statusCode: number = 200): Promise<request.Response> {
	return request(app)
		.post(route)
		.send(params)
		.set('Accept', 'application/json')
		.expect('Content-Type', /json/)
		.expect(statusCode);
}

describe('Server API', () => {
	const now = Date.now();

	const gameId = 'game1';

	const user1: UserData = {
		userId: 'user1',
		name: 'user1_name',
		score: 24,
	};

	const user2: UserData = {
		userId: 'user2',
		name: 'user2_name',
		score: 83,
		params: 'some_payload_2',
	};

	const user3: UserData = {
		userId: 'user3',
		score: 44,
		params: 'some_payload_3',
	};

	beforeEach(() => {
		jest.useFakeTimers({ now: now });
	});

	afterEach(() => {
		jest.restoreAllMocks();
		jest.useRealTimers();
	});

	afterAll(() => {
		server.Shutdown();
	});

	test('status => success', async () => {
		const response = await request(app)
			.get('/status')
			.expect(200)
			.expect('Content-Type', /json/);
		expect(response.body).toStrictEqual({ result: 'success' });
	});

	test('get top => empty data', async () => {
		const response = await ApiCall('/leaderboard/GetTop', { gameId: gameId, nTop: 10 });
		expect(response.body).toStrictEqual({ result: [] });
	});

	test('send score => success', async () => {
		const response = await ApiCall('/leaderboard/SendScore', { gameId: gameId, ...user1 });
		expect(response.body).toStrictEqual({ result: 'success' });
	});

	test('get score => success', async () => {
		let response: request.Response;

		response = await ApiCall('/leaderboard/SendScore', { gameId: gameId, ...user2 });
		expect(response.body).toStrictEqual({ result: 'success' });

		response = await ApiCall('/leaderboard/GetScore', { gameId: gameId, userId: user2.userId });
		expect(response.body).toStrictEqual({ result: { score: user2.score, name: user2.name, params: user2.params } });
	});

	test('delete score => success', async () => {
		let response: request.Response;

		response = await ApiCall('/leaderboard/SendScore', { gameId: gameId, ...user3 });
		expect(response.body).toStrictEqual({ result: 'success' });

		response = await ApiCall('/leaderboard/DeleteScore', { gameId: gameId, userId: user3.userId });
		expect(response.body).toStrictEqual({ result: 'success' });

		response = await ApiCall('/leaderboard/GetScore', { gameId: gameId, userId: user3.userId });
		expect(response.body).toStrictEqual({ result: {} });
	});

	test('get top => success', async () => {
		let response: request.Response;

		response = await ApiCall('/leaderboard/SendScore', { gameId: gameId, ...user1 });
		expect(response.body).toStrictEqual({ result: 'success' });

		response = await ApiCall('/leaderboard/SendScore', { gameId: gameId, ...user2 });
		expect(response.body).toStrictEqual({ result: 'success' });

		response = await ApiCall('/leaderboard/SendScore', { gameId: gameId, ...user3 });
		expect(response.body).toStrictEqual({ result: 'success' });

		jest.useFakeTimers({ now: now + server.GetAppContext().appConfig.cache.config.ttl });

		for (let i = 0; i < 2; ++i) {
			response = await ApiCall('/leaderboard/GetTop', { gameId: gameId, nTop: 10 });
			expect(response.body).toStrictEqual({ result: [user2, user3, user1] });
		}
	});

	test('not found => error', async () => {
		const response: request.Response = await ApiCall('/fake_path', {}, 404);
		expect(response.body).toHaveProperty('error');
	});

	test('wrong request params => error', async () => {
		const response: request.Response = await ApiCall('/leaderboard/SendScore', { gameId: gameId, fake_param: 'abc' }, 400);
		expect(response.body).toHaveProperty('error');
	});

	test('unexpected exception thrown => error', async () => {
		const module = await import('../src/lib/LeaderboardService');
		jest
			.spyOn(module.LeaderboardService.prototype, 'PutUserScore')
			.mockImplementation(() => {
				throw new Error('Unexpected test error');
			});
		const response: request.Response = await ApiCall('/leaderboard/SendScore', { gameId: gameId, ...user1 }, 500);
		expect(response.body).toHaveProperty('error');
	});

});