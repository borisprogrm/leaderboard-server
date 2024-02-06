import { jest } from '@jest/globals';

import fs from 'fs';
import pg from 'pg';
import { IMemoryDb, newDb } from 'pg-mem';

import PostgreProvider from '../src/lib/db/postgresql/PostgreProvider';
import { TopData, UserProperties } from '../src/lib/db/DbProvider.types';

describe('PostgreProvider', () => {
	let dbMock: IMemoryDb;
	let dbProvider: PostgreProvider;

	class PgPoolMock {
		constructor(private readonly db: IMemoryDb) {
			this.db = db;
		}

		private PrepareSQLText(text: string, values?: string[]) {
			if (!Array.isArray(values)) {
				return text;
			}

			let sqlStr: string = text;
			const N = values.length;
			for (let i = N; i > 0; i--) {
				const value = values[i - 1];
				const valueType = typeof value;
				
				let valueStr: string;
				if (valueType === 'string') {
					valueStr = pg.escapeLiteral(value);
				}
				else if (valueType === 'number') {
					valueStr = !Number.isNaN(value) ? String(value) : 'null';
				}
				else if (value == null) {
					valueStr = 'null';
				}
				else {
					throw new Error('Unknown value type');
				}
		
				sqlStr = sqlStr.replace(new RegExp(`\\$${i}`, 'g'), valueStr);
			}
			return sqlStr;
		}
	
		query(text: string, values?: string[]) {
			return this.db.public.query(this.PrepareSQLText(text, values));
		}

		async end() {}
	}

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
		dbMock = newDb();
		dbProvider = new PostgreProvider();
		
		// Emulate pg pool via pg-mem
		dbProvider['pool'] = new PgPoolMock(dbMock) as unknown as pg.Pool;

		// Create db tables and indexes
		dbMock.public.none(fs.readFileSync('./src/lib/db/postgresql/dbSetup.sql', 'utf8'));
	})

	afterAll(async () => {
		await dbProvider.Shutdown();
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