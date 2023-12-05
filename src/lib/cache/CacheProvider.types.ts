import {TopData} from '../db/DbProvider.types.js';
export {TopData}

export type CacheData = [exp: number, data: TopData];

export type CacheProviderConfig = {isDebug?: boolean, ttl: number} & {[key: string]: unknown};
export interface ICacheProvider {
	Initialize(config: CacheProviderConfig): Promise<void>;
	Get(gameId: string, nTop: number): Promise<TopData | null>;
	Set(gameId: string, topData: TopData): Promise<void>;
	Shutdown(): Promise<void>;
}
