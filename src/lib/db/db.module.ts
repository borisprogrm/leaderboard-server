import { Module } from '@nestjs/common';

import { CONFIG_PROVIDER, DB_PROVIDER } from '../../constants';
import { IConfig } from '../../Config.types';
import { DbProvidersIndex } from './index';

const databaseProvider = {
	provide: DB_PROVIDER,
	useFactory: async (config: IConfig) => {
		const { default: dbProviderClass } = await import(`./${DbProvidersIndex[config.db.providerType]}`);
		return new dbProviderClass();
	},
	inject: [CONFIG_PROVIDER],
};

@Module({
	providers: [databaseProvider],
	exports: [databaseProvider],
})
export class DatabaseModule { }
