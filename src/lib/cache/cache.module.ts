import { Module } from '@nestjs/common';

import { CONFIG_PROVIDER, CACHE_PROVIDER } from '../../constants';
import { IConfig } from '../../Config.types';
import { CacheProvidersIndex } from './index';

const cacheProvider = {
	provide: CACHE_PROVIDER,
	useFactory: async (config: IConfig) => {
		const { default: cacheProviderClass } = await import(`./${CacheProvidersIndex[config.cache.providerType]}`);
		return new cacheProviderClass();
	},
	inject: [CONFIG_PROVIDER],
};

@Module({
	providers: [cacheProvider],
	exports: [cacheProvider],
})
export class CacheModule { }
