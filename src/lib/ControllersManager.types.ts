import { Request, Response } from 'express';
import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';

import { IAppContext } from '../app.types';
export { IAppContext };

export type ControllerHandlerFunc = (request: Request, response: Response) => Promise<void>;
export type ControllerMethod = 'get' | 'post' | 'put' | 'delete';
export type OperationObject = OpenAPIV3.OperationObject;

export interface IController {
	/**
	 * App context object (passed by ControllerManager)
	 */
	readonly context: IAppContext;

	/**
	 * Express path
	 */
	readonly route: string;

	/**
	 * Express method
	 */
	readonly method: ControllerMethod;

	/**
	 * OpenAPI schema (used to validate request and response params and generate a full API specification)
	 */
	readonly schema?: OperationObject;

	/**
	 * Controller handler function
	 */
	ControllerHandler: ControllerHandlerFunc;
}
