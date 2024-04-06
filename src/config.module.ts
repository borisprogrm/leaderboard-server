import { Module, Global } from '@nestjs/common';

import { CONFIG_PROVIDER } from './constants';
import { config } from './Config';

@Global()
@Module({
	imports: [
	],
	providers: [{
		provide: CONFIG_PROVIDER,
		useValue: config
	}],
	controllers: [],
	exports: [CONFIG_PROVIDER],
})
export class GlobalConfigModule { }
