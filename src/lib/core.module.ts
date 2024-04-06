import { Module } from '@nestjs/common';

import { DatabaseModule } from './db/db.module';
import { CacheModule } from './cache/cache.module';
import { LeaderboardService } from './leaderboard.service';

@Module({
	imports: [
		DatabaseModule,
		CacheModule,
	],
	providers: [
		LeaderboardService,
	],
	controllers: [],
	exports: [
		LeaderboardService,
	]
})
export class CoreModule { }