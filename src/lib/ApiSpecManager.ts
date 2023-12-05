import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types.js';
import { IConfig } from '../app.types.js';
import { IController } from './ControllersManager.types.js';

export class ApiSpecManager {
	private config: IConfig;
	private apiSpec: OpenAPIV3.Document;

	constructor(config: IConfig) {
		this.config = config;
		this.apiSpec = this.config.apiSpec;
	}

	RegisterController(controller: IController): void {
		if (controller.schema) {
			this.apiSpec.paths[controller.route] = {
				[controller.method]: controller.schema,
			};
			const responses = this.apiSpec.paths[controller.route][controller.method]?.responses;
			if (responses) {
				responses['4XX'] = {
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
				responses['500'] = {
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
	}

	GetApiSpec(): OpenAPIV3.Document {
		return this.apiSpec;
	}
}
