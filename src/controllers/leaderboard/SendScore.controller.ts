import { Controller, Post, HttpCode, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { LeaderboardService } from '../../lib/leaderboard.service';

@Controller('leaderboard')
export default class SendScoreController {
	constructor(
		private readonly leaderboardService: LeaderboardService
	) { }

	@Post('SendScore')
	@ApiOperation({
		description: 'Stores user data in a database',
		tags: ['user'],
	})

	@ApiBody({
		required: true,
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
	})

	@ApiResponse({
		status: 200,
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
	})

	@HttpCode(200)

	async handler(@Req() request: Request, @Res() response: Response) {
		const { gameId, userId, score, name, params } = request.body;

		await this.leaderboardService.PutUserScore(
			gameId,
			userId,
			{ score: score, name: name, params: params }
		);

		response.send({ result: 'success' });
	}
}
