import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { HttpError } from "express-openapi-validator/dist/framework/types";

import { IConfig } from '../Config.types';

import log4js from 'log4js';
const logger = log4js.getLogger('App');

@Catch(HttpError)
export class OpenApiExceptionFilter implements ExceptionFilter {
	constructor(
		private readonly config: IConfig,
	) { }

	catch(err: HttpError, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		response.status(err.status).json({ error: String(err) });
	}
}

@Catch()
export class GenericExceptionFilter implements ExceptionFilter {
	constructor(
		private readonly config: IConfig,
	) { }

	catch(err: Error, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const request = ctx.getRequest<Request>();
		const response = ctx.getResponse<Response>();

		const status: number = err instanceof HttpException ? err.getStatus() : 500;
		if (!(err instanceof HttpException)) {
			logger.error(`Internal error at ${request.originalUrl}`, err);
		}
		response.status(status).json({ error: this.config.isDebug ? String(err) : 'Internal server error' });
	}
}
