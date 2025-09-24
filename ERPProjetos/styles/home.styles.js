import { Dimensions, StyleSheet } from 'react-native';
import { colors, globalStyles } from './global';

const numColumns = 2;
const screenWidth = Dimensions.get('window').width;
const cardSize = screenWidth / numColumns - 20;

export const homeStyles = StyleSheet.create({
  container: {
    ...globalStyles.container,
  },
  grid: {
    padding: 10,
    justifyContent: 'center',
  },
  card: {
    ...globalStyles.card,
    margin: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
});

// Função helper para calcular estilos dinâmicos
export const getCardStyle = (index) => {
  const isLastColumn = (index + 1) % numColumns === 0;
  const isFirstColumn = index % numColumns === 0;
  return {
    width: cardSize,
    height: cardSize,
    marginLeft: isFirstColumn ? 2 : 10, 
    marginRight: isLastColumn ? 10 : 2, // Margem apenas na última coluna
  };
};

export { cardSize, numColumns };
