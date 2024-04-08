import log4js from "log4js";
const logger = log4js.getLogger('Server');

import * as http from 'http';
import express, { Express, Router, Request, Response, NextFunction } from 'express';

import * as HttpTerminator from 'http-terminator';

import { ControllersManager } from './ControllersManager';

import * as OpenApiValidator from 'express-openapi-validator';
import { HttpError } from 'express-openapi-validator/dist/framework/types';

import swaggerUi from 'swagger-ui-express';

import { IAppContext, IConfig } from '../app.types';

export class Server {
	private app: Express;
	private server: http.Server | null;
	private httpTerminator: HttpTerminator.HttpTerminator | null;
	private context: IAppContext;
	private config: IConfig;
	private controllersManager: ControllersManager;

	constructor(appContext: IAppContext) {
		this.app = express();
		this.server = null;
		this.httpTerminator = null;
		this.context = appContext;
		this.config = this.context.appConfig;
		this.controllersManager = new ControllersManager(this.context);
	}

	async SetupControllers() {
		this.app.use(express.json({
			limit: '100kb',
			type: 'application/json',
		}));

		const router: Router = express.Router();
		for (const contorllersDir of this.config.controllers) {
			await this.controllersManager.SetupControllersFromDir(contorllersDir, router);
		}

		const apiSpec = this.controllersManager.GetApiSpec();
		if (this.config.apiUI) {
			this.app.use('/apidoc', swaggerUi.serve, swaggerUi.setup(apiSpec));
		}

		if (this.config.apiValidation.validateRequests || this.config.apiValidation.validateResponses) {
			this.app.use(OpenApiValidator.middleware({
				apiSpec: apiSpec,
				validateRequests: this.config.apiValidation.validateRequests,
				validateResponses: this.config.apiValidation.validateResponses,
			}));
		}

		this.app.use(router);

		this.app.all('/*', this.controllersManager.ControllerSafeWrapper(async (request: Request, response: Response) => {
			logger.debug('Not found', request.originalUrl);
			response.status(404).send({ error: 'Not found' });
		}));

		this.app.use((err: Error, request: Request, response: Response, _next: NextFunction): void => {
			logger.error('Error at', request.originalUrl, String(err));
			response.status((err as HttpError).status ?? 500).send({ error: String(err) });
		});
	}

	async Start(port: number, onCloseCallback?: () => void) {
		this.server = this.app.listen(port, '0.0.0.0', () => {
			logger.info('Server started on port', port);
		});

		this.httpTerminator = HttpTerminator.createHttpTerminator({
			server: this.server,
			gracefulTerminationTimeout: this.config.gracefulTerminationTimeout ?? 5000,
		});

		this.server.on('error', (err) => {
			logger.error(err);
			this.server?.close();
		});

		this.server.on('close', () => {
			logger.info('Server closed');
			if (onCloseCallback) {
				onCloseCallback();
			}
		});
	}

	Shutdown() {
		logger.info('Graceful shutdown...');
		this.httpTerminator?.terminate().catch(err => {
			logger.error(err);
		});
	}

	GetAppInstance(): Express {
		return this.app;
	}

	GetAppContext(): IAppContext {
		return this.context;
	}
}
