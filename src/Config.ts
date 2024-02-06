import * as ConfigTypes from './Config.types.js';

const apiSpecHdr = {
	openapi: '3.0.1',
	info: {
		title: 'Leaderboard API',
		version: '1.0.0',
	},
	paths: {},
};

/**
 * Local tests config
 */
const configTest: ConfigTypes.IConfig = {
	apiSpec: apiSpecHdr,
	apiValidation: {
		validateRequests: true,
		validateResponses: true,
	},
	isDebug: true,
	port: Number(process.env.APP_PORT ?? 8415),
	controllers: [
		'controllers',
		'controllers/leaderboard'
	],
	gracefulTerminationTimeout: 10000,
	db: {
		providerType: 'inmemory',
		config: {},
	},
	cache: {
		providerType: 'simple',
		config: {
			ttl: 0,
		},
	},
	apiUI: true,
};

/**
 * DEBUG config
 */
const configDebug: ConfigTypes.IConfig = {
	apiSpec: apiSpecHdr,
	apiValidation: {
		validateRequests: true,
		validateResponses: true,
	},
	isDebug: true,
	port: Number(process.env.APP_PORT ?? 8415),
	controllers: [
		'controllers',
		'controllers/leaderboard'
	],
	gracefulTerminationTimeout: 5000,
	db: {
		providerType: 'redis',
		config: {
			host: process.env.REDIS_HOST ?? '127.0.0.1',
			port: Number(process.env.APP_PORT ?? 6379),
		},

		/* OR
		providerType: 'dynamodb',
		config: {
			client: {
				endpoint: 'http://localhost:8000',
				apiVersion: '2012-08-10',
				credentials: {
					accessKeyId: 'none',
					secretAccessKey: 'none',
				},
				region: 'local',
			},
			nShards: 4,
		},
		*/

		/* OR
		providerType: 'mongodb',
		config: {
			url: 'mongodb://localhost:27017',
			options: {
				serverSelectionTimeoutMS: 5000,
			},
		},
		*/

		/* OR
		providerType: 'postgresql',
		config: {
			host: '127.0.0.1',
			port: 5432,
			database: process.env.POSTGRES_DB,
			user: process.env.POSTGRES_USER,
			password: process.env.POSTGRES_PASSWORD,
		},
		*/
	},
	cache: {
		providerType: 'simple',
		config: {
			ttl: 1 * 1000,
		},
	},
	apiUI: true,
};

/**
 * PRODUCTION config
 */
const configProduction: ConfigTypes.IConfig = {
	apiSpec: apiSpecHdr,
	apiValidation: {
		validateRequests: true,
		validateResponses: false,
	},
	isDebug: false,
	port: Number(process.env.APP_PORT ?? 8415),
	controllers: [
		'controllers',
		'controllers/leaderboard'
	],
	gracefulTerminationTimeout: 5000,
	db: {
		// TODO: add actual db config here...
		providerType: 'redis',
		config: {
			host: process.env.REDIS_HOST,
			port: Number(process.env.APP_PORT),
		},
	},
	cache: {
		providerType: 'simple',
		config: {
			ttl: 10 * 1000,
		},
	},
	apiUI: false,
};

export type IConfig = ConfigTypes.IConfig;
export const config = ({
	'test': configTest,
	'development': configDebug,
	'production': configProduction,
})[process.env.APP_ENV ?? ''] ?? configDebug;
