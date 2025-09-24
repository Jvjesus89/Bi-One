import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useNavigation } from 'expo-router';
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';


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
    marginBottom: 10,
  },
  listContainer: {
    padding: 16,
  },
  card: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
    marginTop: 8,
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
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 10,
    justifyContent: 'center',
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: colors.primary,
    borderRadius: 30,
    padding: 16,
    elevation: 5,
  },
});

export default function FinancialScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tipoFiltro, setTipoFiltro] = useState('TODOS'); 


  const [formData, setFormData] = useState({
    tipo: '',
    valor: '',
    dtvencimento: '',
    observacao: '',
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Financeiro',
      headerStyle: { backgroundColor: colors.white },
      headerTintColor: colors.text,
      headerTitleStyle: { fontWeight: 'bold' },
      headerBackTitle: 'Voltar',
    });
  }, [navigation, colors]);

  const loadFinancialRecords = useCallback(async () => {
    try {
      let query = supabase
        .from('financeiro')
        .select(`
          idfinanceiro,
          valor,
          dtvencimento,
          tipo,
          observacao,
          clientes ( razao ),
          formas_pagamento ( descricao ),
          vendas ( nome_obra),
          idvenda
        `)
        .order('dtvencimento', { ascending: false });

      if (searchQuery.trim()) {
        query = query.ilike('clientes.razao', `%${searchQuery.trim()}%`);
      }

      if (tipoFiltro !== 'TODOS') {
      query = query.eq('tipo', tipoFiltro);
      }


      const { data, error } = await query;

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Erro ao carregar registros financeiros:', error);
      Alert.alert('Erro', 'Não foi possível carregar os registros financeiros.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, tipoFiltro]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadFinancialRecords();
    }, [loadFinancialRecords])
  );

  const handleSave = async () => {
    try {
      const { tipo, valor, dtvencimento, observacao } = formData;

      const { error } = await supabase.from('financeiro').insert([{
        tipo,
        valor: parseFloat(valor),
        dtvencimento,
        observacao,
      }]);

      if (error) throw error;

      Alert.alert('Sucesso', 'Lançamento criado com sucesso!');
      setModalVisible(false);
      setFormData({ tipo: '', valor: '', dtvencimento: '', observacao: '' });
      loadFinancialRecords();
    } catch (err) {
      console.error('Erro ao salvar lançamento:', err);
      Alert.alert('Erro', 'Não foi possível salvar o lançamento.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Lançamento #{item.idfinanceiro}</Text>
      <Text style={styles.cardSubtitle}>Cliente: {item.clientes?.razao || 'N/A'}</Text>
      <Text style={styles.cardSubtitle}>Obra: {item.vendas?.nome_obra || 'N/A'}</Text>
      <Text style={styles.cardSubtitle}>Venda de Origem: #{item.idvenda || 'N/A'}</Text>
      <Text style={styles.cardSubtitle}>Forma de Pagamento: {item.formas_pagamento?.descricao || 'N/A'}</Text>
      <Text style={styles.cardSubtitle}>Vencimento: {new Date(item.dtvencimento).toLocaleDateString('pt-BR')}</Text>
      <Text style={styles.cardSubtitle}>Observação: {item.observacao || '-'}</Text>
      <Text style={styles.cardSubtitle}>
        Tipo: {item.tipo === 'ENTRADA' ? 'A Receber' : item.tipo === 'SAÍDA' ? 'A Pagar' : item.tipo}
      </Text>
      <Text
  style={[
    styles.cardValue,
    item.tipo === 'SAÍDA' && { color: colors.danger }
  ]}
>
  R$ {(item.valor || 0).toFixed(2).replace('.', ',')}
</Text>

    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome do cliente..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textLight}
        />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 }}>
       {['TODOS', 'ENTRADA', 'SAÍDA'].map((tipo) => (
      <TouchableOpacity
      key={tipo}
      onPress={() => setTipoFiltro(tipo)}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: tipoFiltro === tipo ? colors.primary : colors.background,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ color: tipoFiltro === tipo ? colors.white : colors.text }}>
        {tipo === 'TODOS' ? 'Todos' : tipo === 'ENTRADA' ? 'A Receber' : 'A Pagar'}
      </Text>
      </TouchableOpacity>
      ))}
      </View>


      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando financeiro...</Text>
        </View>
      ) : records.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum lançamento encontrado</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? `Nenhum resultado para "${searchQuery}"` : 'As vendas irão gerar lançamentos financeiros aqui.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.idfinanceiro)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Modal de criação */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Lançamento</Text>

            {/* Seletor de tipo */}
            <Text style={styles.modalTitle}>Tipo de lançamento</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: formData.tipo === 'SAÍDA' ? colors.danger : colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setFormData({ ...formData, tipo: 'SAÍDA' })}
              >
                <Text style={{ color: colors.text }}>A Pagar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: formData.tipo === 'ENTRADA' ? colors.success : colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setFormData({ ...formData, tipo: 'ENTRADA' })}
              >
                <Text style={{ color: colors.text }}>A Receber</Text>
              </TouchableOpacity>
            </View>

            {/* Campos do formulário */}
            <TextInput
              placeholder="Valor"
              keyboardType="numeric"
              value={formData.valor}
              onChangeText={(text) => setFormData({ ...formData, valor: text })}
              style={styles.searchInput}
              placeholderTextColor={colors.textLight}
            />
<TouchableOpacity
  onPress={() => setShowDatePicker(true)}
  style={styles.searchInput}
>
  <Text style={{ color: colors.text }}>
    {formData.dtvencimento
      ? new Date(formData.dtvencimento).toLocaleDateString('pt-BR')
      : 'Selecionar data de vencimento'}
  </Text>
</TouchableOpacity>

{showDatePicker && (
  <DateTimePicker
    value={selectedDate}
    mode="date"
    display="default"
    onChange={(event, date) => {
      setShowDatePicker(false);
      if (date) {
        setSelectedDate(date);
        setFormData({ ...formData, dtvencimento: date.toISOString().split('T')[0] });
      }
    }}
  />
)}
            <TextInput
              placeholder="Observação"
              value={formData.observacao}
              onChangeText={(text) => setFormData({ ...formData, observacao: text })}
              style={styles.searchInput}
              placeholderTextColor={colors.textLight}
            />

            {/* Botões de ação */}
            <View style={styles.modalButtons}>
              <Button title="Cancelar" onPress={() => setModalVisible(false)} />
              <Button title="Concluir" onPress={handleSave} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Botão flutuante */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
