import { Controller, Post, HttpCode, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { LeaderboardService } from '../../lib/leaderboard.service';

@Controller('leaderboard')
export default class GetTopController {
	constructor(
		private readonly leaderboardService: LeaderboardService
	) { }

	@Post('GetTop')
	@ApiOperation({
		description: 'Returns data of users with maximum registered scores sorted in descending order of score, maximum nTop number of elements for a specific gameId',
		tags: ['top'],
	})

	@ApiBody({
		required: true,
		schema: {
			type: "object",
			properties: {
				gameId: { description: 'Id of game', type: 'string', minLength: 1, maxLength: 50, pattern: '^[A-Za-z0-9]*$', example: 'game1' },
				nTop: { description: 'Number of users in top', type: 'integer', minimum: 1, maximum: 100, example: 100 },
			},
			required: ['gameId', 'nTop'],
			additionalProperties: false,
		},
	})

	@ApiResponse({
		status: 200,
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
	})

	@HttpCode(200)

	async handler(@Req() request: Request, @Res() response: Response) {
		const { gameId, nTop } = request.body;

		const topData = await this.leaderboardService.GetTop(gameId, nTop);

		response.send({ result: topData });
	}
}
