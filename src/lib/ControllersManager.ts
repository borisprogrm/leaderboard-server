import log4js from "log4js";
const logger = log4js.getLogger('ControllersManager');

import { Router, Request, Response, IRouterMatcher } from 'express';
import fs from 'fs';
import path from 'path';
import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types.js';

import { IController, ControllerHandlerFunc, IAppContext } from './ControllersManager.types.js';

import { ApiSpecManager } from './ApiSpecManager.js';

export class ControllersManager {
	private readonly context: IAppContext;
	private readonly apiSpecManager: ApiSpecManager;

	constructor(appContext: IAppContext) {
		this.context = appContext;
		this.apiSpecManager = new ApiSpecManager(this.context.appConfig);
	}

	ControllerSafeWrapper(controller: ControllerHandlerFunc) {
		const isDebug = this.context.appConfig.isDebug;
		return (request: Request, response: Response) => {
			controller.call(undefined, request, response).catch((err) => {
				try {
					logger.error('Internal error at', request.originalUrl, err);
					return response.status(500).send({ error: isDebug ? String(err) : 'Internal server error' });
				}
				catch (_err) { /*do nothing*/ }
			});
		};
	}

	SetupController(controller: IController, router: Router) {
		const callback = this.ControllerSafeWrapper(controller.ControllerHandler.bind(controller));
		const methodPtr: IRouterMatcher<Router> = router[controller.method].bind(router);
		methodPtr(controller.route, callback);
		this.apiSpecManager.RegisterController(controller);
	}

	async SetupControllersFromDir(dir: string, router: Router): Promise<void> {
		const files = fs.readdirSync('./dist/' + dir);

		logger.debug(`Setup controllers from ./${dir}/`);

		for (const file of files) {
			if (!/controller.js$/.test(file)) {
				continue;
			}
			try {
				const module = await import(`../${dir}/${path.parse(file).name}.js`);
				const controller = new module.ControllerImpl(this.context);
				this.SetupController(controller, router);
				logger.debug(`controller ${controller.route} from module ${file}`);
			}
			catch (err) {
				logger.error(`Unable to setup controller from module ${file}`);
				throw err;
			}
		}
	}

	GetApiSpec(): OpenAPIV3.Document {
		return this.apiSpecManager.GetApiSpec();
	}
}
