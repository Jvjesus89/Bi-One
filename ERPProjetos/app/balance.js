// app/balance.js

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
    backgroundColor: colors.primary,
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

export default function BalanceScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => getStyles(colors), [colorScheme]);

  const [newQuantity, setNewQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { idestoque, idproduto, descricao, qtdeestoque } = params;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Balanço de Estoque',
      headerStyle: { backgroundColor: colors.white },
      headerTintColor: colors.text,
    });
  }, [navigation, colors]);

  const handleSave = async () => {
    const saldoNovo = parseFloat(String(newQuantity).replace(',', '.')) || 0;

    if (saldoNovo < 0) {
      Alert.alert('Erro', 'A nova quantidade não pode ser negativa.');
      return;
    }
    
    setLoading(true);
    try {
      const saldoAnterior = parseFloat(qtdeestoque);
      const qtdeMovimento = saldoNovo - saldoAnterior;

      const { error } = await supabase.from('movimentoestoque').insert({
        idestoque,
        idproduto,
        tipomovimento: 'BALANCO',
        qtde: qtdeMovimento, // A quantidade do movimento é a diferença
        saldoanterior: saldoAnterior,
        saldonovo: saldoNovo,
      });

      if (error) throw error;

      Alert.alert('Sucesso', 'Balanço de estoque registrado com sucesso!');
      router.back();

    } catch (error) {
      console.error("Erro ao registrar balanço:", error);
      Alert.alert('Erro', 'Não foi possível registrar o balanço de estoque.');
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

      <Text style={styles.label}>Nova quantidade total em estoque:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: 50"
        value={newQuantity}
        onChangeText={setNewQuantity}
        keyboardType="numeric"
        placeholderTextColor={colors.textLight}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.saveButtonText}>Salvar Balanço</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
