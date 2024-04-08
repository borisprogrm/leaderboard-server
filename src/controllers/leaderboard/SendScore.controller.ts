import { Request, Response } from 'express';
import { IController, ControllerMethod, OperationObject, IAppContext } from '../../lib/ControllersManager.types';

export class ControllerImpl implements IController {
	constructor(
		readonly context: IAppContext,
		readonly route: string = '/leaderboard/SendScore',
		readonly method: ControllerMethod = 'post',
		readonly schema: OperationObject = {
			description: 'Stores user data in a database',
			tags: ['user'],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: "object",
							properties: {
								gameId: { description: 'Id of game', type: 'string', minLength: 1, maxLength: 50, pattern: '^[A-Za-z0-9]*$', example: 'game1' },
								userId: { description: 'Id of user', type: 'string', minLength: 1, maxLength: 50, pattern: '^[A-Za-z0-9]*$', example: 'user1' },
								score: { description: 'User score', type: 'number', minimum: 0, example: 1500 },
								name: { description: 'User name', type: 'string', maxLength: 50, example: 'John' },
								params: { description: 'Additional payload', type: 'string', maxLength: 255, example: '{"some_param":"some_value"}' },
							},
							required: ['gameId', 'userId', 'score'],
							additionalProperties: false,
						},
					},
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
		const { gameId, userId, score, name, params } = request.body;

		await this.context.appServices.leaderboardService.PutUserScore(
			gameId,
			userId,
			{ score: score, name: name, params: params }
		);

		response.send({ result: 'success' });
	}
}
