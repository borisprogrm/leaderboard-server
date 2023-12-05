import { IConfig } from './Config.types.js';
import { LeaderboardService } from './lib/LeaderboardService.js';

interface IAppServices {
	readonly leaderboardService: LeaderboardService;
}

export interface IAppContext {
	readonly appConfig: IConfig;
	readonly appServices: IAppServices;
}

export { IConfig };
