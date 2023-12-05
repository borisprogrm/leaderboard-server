import { Request, Response } from 'express';
import { IController, ControllerMethod, OperationObject, IAppContext } from '../lib/ControllersManager.types.js';

export class ControllerImpl implements IController {
	constructor(
		readonly context: IAppContext,
		readonly route: string = '/Status',
		readonly method: ControllerMethod = 'get',
		readonly schema: OperationObject = {
			description: 'Returns server status (success code)',
			tags: ['status'],
			requestBody: {
				required: false,
				content: {
					'application/json': {},
				},
			},
			responses: {
				'200': {
					description: 'Successful response',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									result: { type: 'string', example: 'success' },
								},
								required: ['result'],
							},
						},
					},
				},
			},
		}
	) { }

	async ControllerHandler(request: Request, response: Response): Promise<void> {
		response.send({ result: 'success' });
	}
}
