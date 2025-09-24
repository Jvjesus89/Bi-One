import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './ThemedText';

export function ExternalLink({ href, children }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}
      onPress={() => {
        WebBrowser.openBrowserAsync(href);
      }}>
      <ThemedText type="link" style={styles.text}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    marginVertical: 8,
  },
  pressed: {
    opacity: 0.5,
  },
  text: {
    textDecorationLine: 'underline',
  },
}); 