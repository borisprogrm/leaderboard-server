export const DbProvidersIndex = {
	/**
	 * Simple in-memory local db provider (only for debug!)
	 */
	inmemory: 'inmemory/DbInMemoryProvider.js',

	/**
	 * Redis db provider
	 */
	redis: 'redis/RedisProvider.js',

	/**
	 * DynamoDB provider
	 */
	dynamodb: 'dynamodb/DynamoProvider.js',

	/**
	 * MongoDB provider
	 */
	mongodb: 'mongodb/MongoProvider.js',
};