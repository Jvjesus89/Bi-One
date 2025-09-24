import { StyleSheet } from 'react-native';
import { colors, globalStyles } from './global';

export const authStyles = StyleSheet.create({
  container: {
    ...globalStyles.centeredContainer,
  },
  title: {
    ...globalStyles.title,
  },
  profileInfo: {
    fontSize: 18,
    color: colors.primary,
    marginBottom: 16,
  },
  input: {
    ...globalStyles.input,
  },
  loader: {
    marginTop: 16,
  },
  linkContainer: {
    marginTop: 24,
  },
  link: {
    ...globalStyles.link,
  },
}); 