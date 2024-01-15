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
		default: { appenders: ['out'], level: config.isDebug ? 'ALL' : 'INFO' },
	},
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

function ShutdownServices() {
	return appContext.appServices.leaderboardService.Shutdown().catch(err => {
		logger.error('Failed to gracefully shutdown server with error', err);
	});
}

async function App(): Promise<void> {
	try {
		logger.info(`Start (env="${process.env.APP_ENV ?? 'development'}", isDebug=${config.isDebug})`);

		await InitializeServices();
		await server.SetupControllers();

		logger.info('Initialized');

		await server.Start(config.port, () => {
			ShutdownServices();
			setTimeout(() => {
				logger.warn('Force process exit');
				process.exit();
			}, 3000).unref();
		});
	} catch (err) {
		logger.fatal('Failed to start server', err);
		ShutdownServices().finally(() => process.exit(1));
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
