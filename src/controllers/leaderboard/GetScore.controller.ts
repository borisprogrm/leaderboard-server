import { Request, Response } from 'express';
import { IController, ControllerMethod, OperationObject, IAppContext } from '../../lib/ControllersManager.types.js';

export class ControllerImpl implements IController {
	constructor(
		readonly context: IAppContext,
		readonly route: string = '/leaderboard/GetScore',
		readonly method: ControllerMethod = 'post',
		readonly schema: OperationObject = {
			description: 'Gets user data from a database',
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
							},
							required: ['gameId', 'userId'],
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
									result: {
										oneOf: [
											{
												type: 'object',
												properties: {
													score: { description: 'User score', type: 'number', example: 100 },
													name: { description: 'User name', type: 'string', example: 'John' },
													params: { description: 'Additional payload', type: 'string', example: '{"some_param":"some_value"}' },
												},
												required: ['score'],
											},
											{
												type: 'object',
												minProperties: 0,
												maxProperties: 0,
											},
										],
									},
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
		const { gameId, userId } = request.body;

		const userData = await this.context.appServices.leaderboardService.GetUserScore(gameId, userId);

		response.send({ result: userData ? userData : {} });
	}
}
