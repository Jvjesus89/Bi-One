import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './ThemedText';

export function HapticTab({ onPress, children, style }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.tab, pressed && styles.pressed, style]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}>
      <ThemedText style={styles.text}>{children}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  pressed: {
    opacity: 0.5,
  },
  text: {
    textAlign: 'center',
  },
}); 