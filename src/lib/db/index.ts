export const DbProvidersIndex = {
	/**
	 * Simple in-memory local db provider (only for debug!)
	 */
	inmemory: 'inmemory/DbInMemoryProvider',

	/**
	 * Redis db provider
	 */
	redis: 'redis/RedisProvider',

	/**
	 * DynamoDB provider
	 */
	dynamodb: 'dynamodb/DynamoProvider',

	/**
	 * MongoDB provider
	 */
	mongodb: 'mongodb/MongoProvider',

	/**
	 * PostgreSQL provider
	 */
	postgresql: 'postgresql/PostgreProvider',

	/**
	 * MySQL provider
	 */
	mysql: 'mysql/MySqlProvider',
};