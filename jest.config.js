module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-reanimated|react-native-gesture-handler|react-native-share|react-native-skeleton-placeholder|react-native-image-picker|react-native-heroicons|react-native-geolocation-service|react-native-maps|react-native-vector-icons|react-native-svg)/)',
  ],
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/@react-native-async-storage/async-storage.js',
    '^@env$': '<rootDir>/__mocks__/@env.js',
  },
  testEnvironment: 'node',
};
