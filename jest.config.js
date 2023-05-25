module.exports = {
  roots: ['<rootDir>/test'],
  testMatch: [
    // "**/__tests__/**/*.+(ts|tsx|js)",
    // "**/?(*.)+(spec|test).+(ts|tsx|js)",
    '**/index.test.ts',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!(ethereum-cryptography)/)'],
  globals: {
    'ts-jest': {
      diagnostics: true,
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  preset: 'ts-jest',
};
