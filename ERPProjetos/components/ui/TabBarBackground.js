import { BlurView } from 'expo-blur';

export function TabBarBackground() {
  return <BlurView intensity={80} style={{ flex: 1 }} />;
} 