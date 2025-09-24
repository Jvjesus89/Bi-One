import { Symbol } from 'expo-symbols';
import { StyleSheet } from 'react-native';

export function IconSymbol({ name, size = 24, color = '#000' }) {
  return (
    <Symbol
      name={name}
      size={size}
      color={color}
      style={styles.icon}
    />
  );
}

const styles = StyleSheet.create({
  icon: {
    marginHorizontal: 4,
  },
}); 