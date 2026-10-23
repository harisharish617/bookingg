module.exports = { testEnvironment: 'jsdom', transform: { '^.+\\.[jt]sx?$': 'babel-jest' }, setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'], testMatch: ['**/?(*.)+(test).[jt]s?(x)'] };
