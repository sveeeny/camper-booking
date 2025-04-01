// jest.config.js
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1', // 🔥 Alias-Auflösung für @/xyz
    },
  };
  