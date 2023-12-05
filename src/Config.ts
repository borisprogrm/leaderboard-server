import * as ConfigTypes from './Config.types.js';

const configDebug: ConfigTypes.IConfig = {
	apiSpec: {
		openapi: '3.0.1',
		info: {
			title: 'Leaderboard API (debug)',
			version: '1.0.0',
		},
		paths: {},
	},
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
		providerType: 'inmemory',
		config: {},
	},
	cache: {
		providerType: 'simple',
		config: {
			ttl: 60 * 1000,
		},
	},
	apiUI: true,
};

const configProduction: ConfigTypes.IConfig = {
	apiSpec: {
		openapi: '3.0.1',
		info: {
			title: 'Leaderboard API (production)',
			version: '1.0.0',
		},
		paths: {},
	},
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
		providerType: 'inmemory', // temporally
		config: {},
	},
	cache: {
		providerType: 'simple',
		config: {
			ttl: 60 * 1000,
		},
	},
	apiUI: false,
};

export const config = (process.env.APP_ENV === 'production') ? configProduction : configDebug;
export type IConfig = ConfigTypes.IConfig;
