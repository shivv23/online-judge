/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/__tests__'],
  testMatch: ['**/*.test.ts'],
  globalSetup: '<rootDir>/src/__tests__/setup.ts',
  globalTeardown: '<rootDir>/src/__tests__/teardown.ts',
  testTimeout: 30000,
};
