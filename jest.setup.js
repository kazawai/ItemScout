// filepath: jest.setup.js
import 'react-native-gesture-handler/jestSetup';

// Mock native modules that might cause issues in test environment
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock expo modules that are not available in test environment
jest.mock('expo-font');
jest.mock('expo-asset');
jest.mock('expo-constants', () => ({
  manifest: { extra: { nodeEnv: 'test' } }
}));