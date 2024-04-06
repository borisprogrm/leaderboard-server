import { Controller, Get, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';

@Controller()
export default class StatusController {
	constructor() { }

	@Get('Status')
	@ApiOperation({
		description: 'Returns server status (success code)',
		tags: ['status'],
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

	async handler(@Req() _request: Request, @Res() response: Response) {
		response.send({ result: 'success' });
	}
}
