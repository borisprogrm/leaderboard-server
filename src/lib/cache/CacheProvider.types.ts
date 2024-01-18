import {IDbProvider, TopData} from '../db/DbProvider.types.js';
export {IDbProvider, TopData}

export type CacheData = {
	exp: number,
	cnt: number,
	promise: Promise<TopData>,
};

export type CacheProviderConfig = {isDebug?: boolean, ttl: number} & {[key: string]: unknown};
export interface ICacheProvider {
	Initialize(config: CacheProviderConfig, dbProvider: IDbProvider): Promise<void>;
	Top(gameId: string, nTop: number): Promise<TopData>;
	Shutdown(): Promise<void>;
}
