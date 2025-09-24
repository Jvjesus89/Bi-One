// app/entry.js

import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';

import { Colors } from '@/constants/Colors';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  currentStock: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 4,
  },
  label: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    backgroundColor: colors.white,
    color: colors.text,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: colors.success,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default function EntryScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => getStyles(colors), [colorScheme]);

  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { idestoque, idproduto, descricao, qtdeestoque } = params;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Entrada de Estoque',
      headerStyle: { backgroundColor: colors.white },
      headerTintColor: colors.text,
    });
  }, [navigation, colors]);

  const handleSave = async () => {
    const qtdeEntrada = parseFloat(String(quantity).replace(',', '.')) || 0;

    if (qtdeEntrada <= 0) {
      Alert.alert('Erro', 'A quantidade de entrada deve ser maior que zero.');
      return;
    }

    setLoading(true);
    try {
      const saldoAnterior = parseFloat(qtdeestoque);
      const saldoNovo = saldoAnterior + qtdeEntrada;

      const { error } = await supabase.from('movimentoestoque').insert({
        idestoque,
        idproduto,
        tipomovimento: 'ENTRADA',
        qtde: qtdeEntrada,
        saldoanterior: saldoAnterior,
        saldonovo: saldoNovo,
      });

      if (error) throw error;

      Alert.alert('Sucesso', 'Entrada de estoque registrada com sucesso!');
      router.back();

    } catch (error) {
      console.error("Erro ao registrar entrada:", error);
      Alert.alert('Erro', 'Não foi possível registrar a entrada de estoque.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.productName}>{descricao}</Text>
        <Text style={styles.currentStock}>Estoque atual: {qtdeestoque}</Text>
      </View>

      <Text style={styles.label}>Quantidade a ser adicionada:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: 10"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
        placeholderTextColor={colors.textLight}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.saveButtonText}>Salvar Entrada</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
