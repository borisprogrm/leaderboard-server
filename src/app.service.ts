import { Injectable, Inject, INestApplication, BeforeApplicationShutdown } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import * as OpenApiValidator from "express-openapi-validator";
import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';
import * as HttpTerminator from 'http-terminator';

import { IConfig } from './Config.types';
import { CONFIG_PROVIDER } from './constants';
import { OpenApiExceptionFilter, GenericExceptionFilter } from "./lib/filters";

import log4js from 'log4js';
const logger = log4js.getLogger('App');

@Injectable()
export class AppService implements BeforeApplicationShutdown {
	private httpTerminator: HttpTerminator.HttpTerminator | null;

	constructor(
		@Inject(CONFIG_PROVIDER) readonly config: IConfig,
	) {
		this.httpTerminator = null;
	}

	InitializeApp(app: NestExpressApplication): void {
		const apiSpec = this.PrepareApiSpec(app);
		if (this.config.apiUI) {
			SwaggerModule.setup('apidoc', app, apiSpec);
		}

		app.useBodyParser('json', { limit: '10kb' });

		if (this.config.apiValidation.validateRequests || this.config.apiValidation.validateResponses) {
			app.use(OpenApiValidator.middleware({
				apiSpec: apiSpec as OpenAPIV3.Document,
				validateRequests: this.config.apiValidation.validateRequests,
				validateResponses: this.config.apiValidation.validateResponses,
			}));
		}

		app.useGlobalFilters(
			new GenericExceptionFilter(this.config),
			new OpenApiExceptionFilter(this.config),
		);

		if (process.env.APP_ENV !== 'test') {
			this.SetupGracefulShutdown(app);
		}
	}

	private PrepareApiSpec(app: INestApplication): OpenAPIObject {
		const apiConfig = new DocumentBuilder()
			.setTitle(this.config.apiSpec.info.title)
			.setVersion(this.config.apiSpec.info.version)
			.build();

		const apiSpec = SwaggerModule.createDocument(app, apiConfig);

		Object.keys(apiSpec.paths).forEach((path: string) => {
			const pathObj = (apiSpec as OpenAPIV3.Document).paths[path];
			['get', 'put', 'post', 'delete'].forEach((method: string) => {
				if (method in pathObj) {
					const responsesObj = (pathObj[method as keyof typeof pathObj] as OpenAPIV3.OperationObject)?.responses;
					if (responsesObj) {
						responsesObj['4XX'] = {
							description: 'Bad request',
							content: {
								'application/json': {
									schema: {
										type: 'object',
										properties: {
											error: { type: 'string', example: 'Wrong request params' },
										},
										required: ['error'],
									},
								},
							},
						};
						responsesObj['500'] = {
							description: 'Error response',
							content: {
								'application/json': {
									schema: {
										type: 'object',
										properties: {
											error: { type: 'string', example: 'Internal server error' },
										},
										required: ['error'],
									},
								},
							},
						};
					}
				}
			});
		});

		return apiSpec;
	}

	private SetupGracefulShutdown(app: INestApplication): void {
		app.enableShutdownHooks();
		this.httpTerminator = HttpTerminator.createHttpTerminator({
			server: app.getHttpServer(),
			gracefulTerminationTimeout: this.config.gracefulTerminationTimeout ?? 5000,
		});
	}

	async beforeApplicationShutdown(signal: string) {
		logger.warn(signal);
		try {
			await this.httpTerminator?.terminate();
			logger.info('Connections closed');
		}
		catch (err) {
			logger.error(err);
		}
	}
}
