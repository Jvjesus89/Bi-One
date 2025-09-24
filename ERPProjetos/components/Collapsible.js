import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

export function Collapsible({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    height: withTiming(isOpen ? 'auto' : 0, { duration: 300 }),
    opacity: withTiming(isOpen ? 1 : 0, { duration: 300 }),
  }));

  return (
    <ThemedView style={styles.container}>
      <Pressable
        style={styles.header}
        onPress={() => setIsOpen(!isOpen)}>
        <ThemedText type="subtitle">{title}</ThemedText>
        <ThemedText style={styles.arrow}>{isOpen ? '▼' : '▶'}</ThemedText>
      </Pressable>
      <Animated.View style={[styles.content, animatedStyle]}>
        {children}
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 16,
  },
  arrow: {
    fontSize: 16,
  },
}); 