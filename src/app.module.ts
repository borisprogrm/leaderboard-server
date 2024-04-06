import { Module } from '@nestjs/common';

import { GlobalConfigModule } from './config.module';
import { ManagerModule } from './lib/manager.module';
import { AppService } from './app.service';

@Module({
	imports: [
		GlobalConfigModule,
		ManagerModule.register('controllers'),
		ManagerModule.register('controllers/leaderboard'),
	],
	providers: [AppService],
	controllers: [],
})
export class AppModule { }
