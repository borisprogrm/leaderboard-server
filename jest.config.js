process.env.APP_ENV = 'test';

/** @type {import('jest').Config} */
const config = {
	moduleFileExtensions: ["js", "json", "ts"],
	rootDir: ".",
	testEnvironment: "node",
	testMatch: ['<rootDir>/tests/*.test.ts'],
	transform: {
		"^.+\\.(t|j)s$": "ts-jest"
	},
	clearMocks: true,
    collectCoverage: true,
    collectCoverageFrom: [
        './src/**/*.ts',

    ],
    coveragePathIgnorePatterns: [
		'app.ts',
        '.types.ts',
    ],
    coverageDirectory: '<rootDir>/tests/coverage',
    coverageProvider: 'v8',
}

module.exports = config;
