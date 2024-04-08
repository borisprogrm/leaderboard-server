import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';
import { CacheProvidersIndex } from './lib/cache/index';
import { DbProvidersIndex } from './lib/db/index';

import { CacheProviderConfig } from './lib/cache/CacheProvider.types';
import { DBProviderConfig } from './lib/db/DbProvider.types';

export interface IConfig {
	/**
	 * OpenAPI specification template
	 */
	apiSpec: OpenAPIV3.Document;

	/**
	 * OpenAPI schemas validation params
	 */
	apiValidation: IApiValidationConfig;

	/**
	 * Debug flag
	 */
	isDebug?: boolean;

	/**
	 * HTTP server port
	 */
	port: number;

	/**
	 * Directories for setting up controllers (*.controller.ts)
	 */
	controllers: string[];

	/**
	 * Number of milliseconds to allow for the active sockets to complete serving the response (default: 5000)
	 */
	gracefulTerminationTimeout?: number,

	/**
	 * DB subsystem config
	 */
	db: IDBConfig;

	/**
	 * Cache subsystem config
	 */
	cache: ICacheConfig;

	/**
	 * OpenAPI (Swagger) UI flag (can be viewed via apidoc/ path)
	 */
	apiUI: boolean;
}

export interface IApiValidationConfig {
	/**
	 * Determines whether request params should be checked
	 */
	validateRequests: boolean;

	/**
	 * Determines whether response params should be checked (recommended only for debug)
	 * 
	 */
	validateResponses: boolean;
}

export interface IDBConfig {
	/**
	 * DB subsystem provider type
	 */
	providerType: DBProviderType;

	/**
	 * DB provider config
	 */
	config: DBProviderConfig;
}

export interface ICacheConfig {
	/**
	 * Cache subsystem provider type
	 */
	providerType: CacheProviderType;

	/**
	 * Cache provider config
	 */
	config: CacheProviderConfig;
}

export type DBProviderType = keyof typeof DbProvidersIndex;
export type CacheProviderType = keyof typeof CacheProvidersIndex;
