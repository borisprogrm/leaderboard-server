import { IConfig } from './Config.types';
import { LeaderboardService } from './lib/LeaderboardService';

interface IAppServices {
	readonly leaderboardService: LeaderboardService;
}

export interface IAppContext {
	readonly appConfig: IConfig;
	readonly appServices: IAppServices;
}

export { IConfig };
