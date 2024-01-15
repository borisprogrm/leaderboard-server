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
	gracefulTerminationTimeout: 1000,
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
		providerType: 'redis',
		config: {
			host: process.env.REDIS_HOST ?? '127.0.0.1',
			port: Number(process.env.APP_PORT ?? 6379),
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
