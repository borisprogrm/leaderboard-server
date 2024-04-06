import { Controller, Post, HttpCode, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { LeaderboardService } from '../../lib/leaderboard.service';

@Controller('leaderboard')
export default class GetScoreController {
	constructor(
		private readonly leaderboardService: LeaderboardService
	) { }

	@Post('GetScore')
	@ApiOperation({
		description: 'Gets user data from a database',
		tags: ['user'],
	})

	@ApiBody({
		required: true,
		schema: {
			type: "object",
			properties: {
				gameId: { description: 'Id of game', type: 'string', minLength: 1, maxLength: 50, pattern: '^[A-Za-z0-9]*$', example: 'game1' },
				userId: { description: 'Id of user', type: 'string', minLength: 1, maxLength: 50, pattern: '^[A-Za-z0-9]*$', example: 'user1' },
			},
			required: ['gameId', 'userId'],
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
	})

	@HttpCode(200) 

	async handler(@Req() request: Request, @Res() response: Response) {
		const { gameId, userId } = request.body;

		const userData = await this.leaderboardService.GetUserScore(gameId, userId);

		response.send({ result: userData ? userData : {} });
	}
}
