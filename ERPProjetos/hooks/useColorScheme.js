import { useColorScheme as _useColorScheme } from 'react-native';

// This hook is a wrapper around the `useColorScheme` hook from React Native.
// It is used to get the current color scheme of the device.
export function useColorScheme() {
  return _useColorScheme();
}

