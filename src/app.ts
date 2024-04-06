import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { AppService } from './app.service';

import log4js from 'log4js';
const logger = log4js.getLogger('App');

import { Log4jsLogger } from './lib/logger.service';

Log4jsLogger.ConfigureLog4jsLogger();

async function bootstrap() {
	logger.log(`Start (env="${process.env.APP_ENV ?? 'development'}")`);

	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		logger: new Log4jsLogger(logger),
	});

	const appService = app.get<AppService>(AppService);
	const config = appService.config;

	appService.InitializeApp(app);

	await app.listen(config.port).catch((err) => {
		logger.fatal('Failed to start server with error', err);
		throw err;		
	});

	logger.log(`Server started on port ${config.port}`);
}

bootstrap();
