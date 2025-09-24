// app/stock.js

import { supabase } from '@/lib/supabase';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme
} from 'react-native';

import { Colors } from '@/constants/Colors';

// Função que cria os estilos fora do componente para melhor performance
const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productInfo: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 14,
    color: colors.textLight,
  },
  productActions: {
    flexDirection: 'column', 
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  entradaButton: {
    backgroundColor: colors.success, 
  },
  balancoButton: {
    backgroundColor: colors.primary, 
  },
});

const StockScreen = () => {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => getStyles(colors), [colorScheme]);
  const router = useRouter();


  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Estoque',
      headerStyle: {
        backgroundColor: colors.white,
      },
      headerTintColor: colors.text,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      headerBackTitle: 'Voltar',
    });
  }, [navigation, colors]);

  const loadProducts = useCallback(async () => {
    try {
      let query = supabase
        .from('estoque')
        .select(`
          idestoque,
          qtdeestoque,
          produtos (
            idproduto,
            descricao
          )
        `)
       .order('produtos(descricao)', { ascending: true });
      if (searchQuery.trim()) {
        query = query.ilike('produtos.descricao', `%${searchQuery.trim()}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao carregar estoque:', error);
      Alert.alert('Erro', 'Não foi possível carregar o estoque');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]); // A função agora só depende da busca

  // Efeito que recarrega os dados sempre que a tela volta a ter foco
  useFocusEffect(
    useCallback(() => {
      setLoading(true); // Mostra o loading ao focar
      loadProducts();
    }, [loadProducts])
  );

  // Efeito para a busca com debounce
  useEffect(() => {
    const searchDebounce = setTimeout(() => {
      loadProducts();
    }, 300);

    return () => clearTimeout(searchDebounce);
  }, [searchQuery, loadProducts]);

  const handleEntrada = (item) => {
    router.push({
        pathname: '/entry', 
        params: { 
            idestoque: item.idestoque,
            idproduto: item.produtos.idproduto,
            descricao: item.produtos.descricao,
            qtdeestoque: item.qtdeestoque
        }
    });
  };

  const handleBalanco = (item) => {
    router.push({
        pathname: '/balance', 
        params: { 
            idestoque: item.idestoque,
            idproduto: item.produtos.idproduto,
            descricao: item.produtos.descricao,
            qtdeestoque: item.qtdeestoque
        }
    });
  };


  const renderItem = ({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.produtos?.descricao || 'Produto sem nome'}</Text>
        <Text style={styles.productQuantity}>Quantidade em estoque: {item.qtdeestoque ?? 0}</Text>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity style={[styles.actionButton, styles.entradaButton]} onPress={() => handleEntrada(item)}>
          <Text style={styles.actionButtonText}>Entrada</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.balancoButton]} onPress={() => handleBalanco(item)}>
          <Text style={styles.actionButtonText}>Balanço</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produto no estoque..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textLight}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando estoque...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum item no estoque</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? `Nenhum resultado para "${searchQuery}"` : 'Cadastre produtos e movimente o estoque.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => String(item.idestoque)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

export default StockScreen;

