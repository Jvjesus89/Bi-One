import { StyleSheet } from 'react-native';

// Cores do tema
export const colors = {
  primary: '#0a7ea4',
  secondary: '#687076',
  background: '#f5f5f5',
  white: '#fff',
  text: '#333',
  textLight: '#687076',
  border: '#ccc',
  shadow: '#000',
};

// Estilos globais
export const globalStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.white,
  },
  
  // Cards
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    elevation: 4, // Sombra Android
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  
  // Inputs
  input: {
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  
  // Textos
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    color: colors.text,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  text: {
    fontSize: 16,
    color: colors.text,
  },
  link: {
    color: colors.primary,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  
  // Botões
  button: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Espaçamentos
  marginVertical: {
    marginVertical: 8,
  },
  marginTop: {
    marginTop: 16,
  },
  padding: {
    padding: 16,
  },
});

// Funções helper para estilos dinâmicos
export const getResponsiveSize = (percentage) => {
  // Função para calcular tamanhos responsivos baseados na largura da tela
  return percentage;
};

export const getShadowStyle = (elevation = 4) => ({
  elevation, // Android
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: elevation,
}); 