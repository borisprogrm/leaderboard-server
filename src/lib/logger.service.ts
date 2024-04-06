import { Injectable, LoggerService } from '@nestjs/common';
import log4js from 'log4js';

@Injectable()
export class Log4jsLogger implements LoggerService {
	constructor(
		private readonly logger: log4js.Logger,
		private treatLogAsDebug: boolean = true,
	) { }

	static ConfigureLog4jsLogger() {
		log4js.configure({
			appenders: {
				out: { type: 'stdout', layout: { type: 'colored' } },
			},
			categories: {
				default: { appenders: ['out'], level: process.env.APP_ENV === 'test' ? 'OFF' : (process.env.APP_ENV === 'production' ? 'INFO' : 'ALL') },
			},
			disableClustering: true,
		});
	}

	private ApplyLog(func: (message: unknown, ...args: unknown[]) => void, message: unknown, context?: string) {
		func.call(this.logger, `[${context}]`, message);
	}

	verbose(message: unknown, context?: string) {
		this.ApplyLog(this.logger.trace, message, context);
	}

	debug(message: unknown, context?: string) {
		this.ApplyLog(this.logger.debug, message, context);
	}

	log(message: unknown, context?: string) {
		this.ApplyLog(this.treatLogAsDebug ? this.logger.debug : this.logger.info, message, context);
	}

	warn(message: unknown, context?: string) {
		this.ApplyLog(this.logger.warn, message, context);
	}

	error(message: unknown, context?: string) {
		this.ApplyLog(this.logger.error, message, context);
	}

	fatal(message: unknown, context?: string) {
		this.ApplyLog(this.logger.fatal, message, context);
	}
}
