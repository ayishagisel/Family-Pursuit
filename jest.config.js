/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@server/(.*)$': '<rootDir>/server/$1',
    '^@client/(.*)$': '<rootDir>/client/$1',
    '^@assets/(.*)$': '<rootDir>/attached_assets/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  collectCoverage: true,
  collectCoverageFrom: [
    'server/**/*.{ts,tsx}',
    '!server/**/*.d.ts',
    '!server/tests/**',
    '!server/scripts/**',
  ],
  coverageDirectory: './coverage',
  setupFilesAfterEnv: ['./server/tests/setup.ts'],
};