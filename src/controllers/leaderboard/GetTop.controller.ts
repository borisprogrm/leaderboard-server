import { Request, Response } from 'express';
import { IController, ControllerMethod, OperationObject, IAppContext } from '../../lib/ControllersManager.types';

export class ControllerImpl implements IController {
	constructor(
		readonly context: IAppContext,
		readonly route: string = '/leaderboard/GetTop',
		readonly method: ControllerMethod = 'post',
		readonly schema: OperationObject = {
			description: 'Returns data of users with maximum registered scores sorted in descending order of score, maximum nTop number of elements for a specific gameId',
			tags: ['top'],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: "object",
							properties: {
								gameId: { description: 'Id of game', type: 'string', minLength: 1, maxLength: 50, pattern: '^[A-Za-z0-9]*$', example: 'game1' },
								nTop: { description: 'Number of users in top', type: 'integer', minimum: 1, maximum: 100, example: 100 },
							},
							required: ['gameId', 'nTop'],
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
										type: 'array',
										items: {
											type: 'object',
											properties: {
												userId: { description: 'Id of user', type: 'string', example: 'user1' },
												score: { description: 'User score', type: 'number', example: 100 },
												name: { description: 'User name', type: 'string', example: 'John' },
												params: { description: 'Additional payload', type: 'string', example: '{"some_param":"some_value"}' },
											},
											required: ['userId', 'score'],
										},
										minItems: 0,
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
		const { gameId, nTop } = request.body;

		const topData = await this.context.appServices.leaderboardService.GetTop(gameId, nTop);

		response.send({ result: topData });
	}
}
