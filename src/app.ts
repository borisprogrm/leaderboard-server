import log4js from "log4js";
const logger = log4js.getLogger('App');

import { IAppContext } from './app.types.js';
import { config } from './Config.js';
import { Server } from './lib/Server.js';
import { LeaderboardService } from './lib/LeaderboardService.js';

log4js.configure({
	appenders: {
		out: { type: 'stdout', layout: { type: 'colored' } },
	},
	categories: {
		default: { appenders: ['out'], level: process.env.APP_ENV === 'test' ? 'OFF' : (config.isDebug ? 'ALL' : 'INFO') },
	},
	disableClustering: true,
});

const appContext: IAppContext = {
	appConfig: config,
	appServices: {
		leaderboardService: new LeaderboardService(config),
	}
};

const server: Server = new Server(appContext);
export default server; // for testing purpose

function InitializeServices() {
	return appContext.appServices.leaderboardService.Initialize();
}

async function ShutdownServices() {
	try {
		await appContext.appServices.leaderboardService.Shutdown();
	}
	catch (err) {
		logger.error('Failed to gracefully shutdown server with error', err);
	}
	await new Promise((resolve) => log4js.shutdown(() => resolve(true)));
}

function ProcessExit(exitCode?: number) {
	if (process.env.APP_ENV !== 'test') {
		process.exit(exitCode);
	}
}

async function App(): Promise<void> {
	try {
		logger.info(`Start (env="${process.env.APP_ENV ?? 'development'}", isDebug=${config.isDebug})`);

		await InitializeServices();
		await server.SetupControllers();

		logger.info('Initialized');

		await server.Start(config.port, () => {
			ShutdownServices().finally(() => ProcessExit());
		});
	} catch (err) {
		logger.fatal('Failed to start server', err);
		ShutdownServices().finally(() => ProcessExit(1));
	}
}

process.on('SIGTERM', () => {
	logger.warn('SIGTERM');
	server.Shutdown();
});

process.on('SIGINT', () => {
	logger.warn('SIGINT');
	server.Shutdown();
});

process.on('uncaughtException', (err) => {
	logger.fatal('Uncaught exception', err);
	throw err; // an application is in an undefined state so we can't continue
});

App();
