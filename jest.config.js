/** @type {import('ts-jest').JestConfigWithTsJest} */
process.env.APP_ENV = 'test';
export default {
	clearMocks: true,
	collectCoverage: true,
	collectCoverageFrom: [
		'./src/**/*.ts',
	],
	coveragePathIgnorePatterns: [
		'.types.ts',
		'index.ts',
	],
	coverageDirectory: '<rootDir>/tests/coverage',
	coverageProvider: 'v8',
	testEnvironment: 'node',
	testMatch: ['<rootDir>/tests/*.test.ts'],
	preset: 'ts-jest',
	transform: {
		'^.+\\.(js|jsx|ts|tsx)$': ['ts-jest', {
			useESM: true,
		}],
	},
	moduleNameMapper: {
		'^(\\.\\.?\\/.+)\\.js?$': '$1',
	},
	extensionsToTreatAsEsm: ['.ts'],
};