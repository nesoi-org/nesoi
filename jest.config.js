/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '~/(.*)': '<rootDir>/src/$1',
        'nesoi/tools/(.*)': '<rootDir>/tools/$1',
    },
    watchPathIgnorePatterns: ['tmp']
};