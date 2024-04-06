import { jest } from '@jest/globals';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from '../src/app.module';
import { AppService } from '../src/app.service';
import { UserData } from '../src/lib/db/DbProvider.types';

import log4js from 'log4js';
const logger = log4js.getLogger('App');

import { Log4jsLogger } from '../src/lib/logger.service';

Log4jsLogger.ConfigureLog4jsLogger();

let app: NestExpressApplication;
let appService: AppService;

async function ApiCall(route: string, params: object, statusCode: number = 200): Promise<request.Response> {
	return request(app.getHttpServer())
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

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleRef.createNestApplication<NestExpressApplication>({
			logger: new Log4jsLogger(logger),
		});

		appService = app.get<AppService>(AppService);
		appService.InitializeApp(app);

		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(() => {
		jest.useFakeTimers({ now: now });
	});

	afterEach(() => {
		jest.restoreAllMocks();
		jest.useRealTimers();
	});

	test('status => success', async () => {
		const response = await request(app.getHttpServer())
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

		jest.useFakeTimers({ now: now + appService.config.cache.config.ttl });

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
		const module = await import('../src/lib/leaderboard.service');
		jest
			.spyOn(module.LeaderboardService.prototype, 'PutUserScore')
			.mockImplementation(() => {
				throw new Error('Unexpected test error');
			});
		const response: request.Response = await ApiCall('/leaderboard/SendScore', { gameId: gameId, ...user1 }, 500);
		expect(response.body).toHaveProperty('error');
	});

});
