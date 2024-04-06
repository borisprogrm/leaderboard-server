import { Controller, Post, HttpCode, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { LeaderboardService } from '../../lib/leaderboard.service';

@Controller('leaderboard')
export default class DeleteScoreController {
	constructor(
		private readonly leaderboardService: LeaderboardService
	) { }

	@Post('DeleteScore')
	@ApiOperation({
		description: 'Removes user data from a database',
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
						result: { type: 'string', example: 'success' },
					},
					required: ['result'],
				},
			},
		},
	})

	@HttpCode(200)

	async handler(@Req() request: Request, @Res() response: Response) {
		const { gameId, userId } = request.body;

		await this.leaderboardService.DeleteUserScore(gameId, userId);

		response.send({ result: 'success' });
	}
}
