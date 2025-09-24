import { supabase } from '@/lib/supabase';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { router, useNavigation } from 'expo-router';

// Função que cria os estilos de acordo com o tema
const getStyles = (colors) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
    listContainer: {
      padding: 16,
    },
    itemCard: { // Renomeado de productCard para itemCard
      backgroundColor: colors.white,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    itemImage: { // Renomeado
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 12,
      backgroundColor: '#f0f0f0',
    },
    itemInfo: { // Renomeado
      flex: 1,
    },
    itemDescription: { // Renomeado
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    itemCode: { // Renomeado
      fontSize: 14,
      color: colors.textLight,
      marginBottom: 4,
    },
    itemPrice: { // Renomeado
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
    },
    itemActions: { // Renomeado
      flexDirection: 'row',
      gap: 8,
      paddingLeft: 10,
    },
    actionButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    editButton: {
      backgroundColor: '#ffc107',
    },
    deleteButton: {
      backgroundColor: '#dc3545',
    },
    actionButtonText: {
      fontSize: 16
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.white,
      borderRadius: 16,
      padding: 24,
      width: '90%',
      maxWidth: 400,
    },
    modalTitle: {
      textAlign: 'center',
      marginBottom: 20,
      fontSize: 18,
      color: colors.text,
    },
    modalImage: {
      width: '100%',
      height: 150,
      borderRadius: 8,
      marginBottom: 15,
      resizeMode: 'contain',
      backgroundColor: '#f0f0f0'
    },
    modalImagePlaceholder: {
      width: '100%',
      height: 150,
      borderRadius: 8,
      marginBottom: 15,
      backgroundColor: '#f0f0f0',
      justifyContent: 'center',
      alignItems: 'center'
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      fontSize: 16,
      backgroundColor: colors.white,
      color: colors.text,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 20,
    },
    modalButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: '#f8f9fa',
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    cancelButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '500',
    },
    saveButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '500',
    },
    typeSelectorContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 20,
      gap: 10,
    },
    typeButton: {
      flex: 1,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      alignItems: 'center',
    },
    typeButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    typeButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.textLight,
    },
    typeButtonTextActive: {
      color: colors.white,
    },
    compositionButton: {
      backgroundColor: colors.secondary,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 10,
    },
    compositionButtonText: {
      color: colors.white,
      fontWeight: '600',
    },
});

export default function ProductsAndServicesScreen() {
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const styles = useMemo(() => getStyles(colors), [colors]);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [codigo, setCodigo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [preco, setPreco] = useState('');
    const [custo, setCusto] = useState('');
    const [fotoUrl, setFotoUrl] = useState('');
    const [itemType, setItemType] = useState('produto');
    const [unidade, setUnidade] = useState('');

    const resetForm = useCallback(() => {
        setCodigo('');
        setDescricao('');
        setPreco('');
        setCusto('');
        setFotoUrl('');
        setItemType('produto');
        setUnidade('');
        setEditingItem(null);
    }, []);

    const openModal = useCallback((item = null) => {
        if (item) {
            setEditingItem(item);
            setCodigo(item.codigo || '');
            setDescricao(item.descricao || '');
            setPreco(item.preco ? item.preco.toString() : '');
            setCusto(item.custo ? item.custo.toString() : '');
            setFotoUrl(item.foto_url || '');
            setItemType(item.type || 'produto');
            setUnidade(item.unidade || '');
        } else {
            resetForm();
        }
        setModalVisible(true);
    }, [resetForm]);

    useLayoutEffect(() => {
        navigation.setOptions({
            title: 'Produtos e Serviços',
            headerRight: () => (
                <TouchableOpacity onPress={() => openModal()} style={{ paddingRight: 5 }}>
                    <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>+ Adicionar</Text>
                </TouchableOpacity>
            ),
            headerStyle: { backgroundColor: colors.white },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: 'bold' },
        });
    }, [navigation, colors, openModal]);

    const loadItems = useCallback(async () => {
        try {
            if (items.length === 0) setLoading(true);

            const [productsResponse, servicesResponse] = await Promise.all([
                supabase.from('produtos').select('*'),
                supabase.from('servicos').select('*')
            ]);

            if (productsResponse.error) throw productsResponse.error;
            if (servicesResponse.error) throw servicesResponse.error;

            const productsData = productsResponse.data.map(p => ({ ...p, type: 'produto', id: p.idproduto }));
            const servicesData = servicesResponse.data.map(s => ({ ...s, type: 'serviço', id: s.idservico }));

            let combinedData = [...productsData, ...servicesData];

            if (searchQuery.trim()) {
                combinedData = combinedData.filter(item =>
                    item.descricao.toLowerCase().includes(searchQuery.trim().toLowerCase())
                );
            }

            combinedData.sort((a, b) => a.descricao.localeCompare(b.descricao));
            setItems(combinedData);
        } catch (error) {
            console.error('Erro ao carregar itens:', error);
            Alert.alert('Erro', 'Não foi possível carregar os itens.');
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            loadItems();
        }, 300);
        return () => clearTimeout(debounce);
    }, [loadItems]);


    const onRefresh = async () => {
        setRefreshing(true);
        await loadItems();
        setRefreshing(false);
    };

    const closeModal = () => {
        setModalVisible(false);
        resetForm();
    };

    const saveItem = async () => {
    if (!descricao.trim()) {
        Alert.alert('Erro', 'A descrição é obrigatória');
        return;
    }

    const precoValue = preco ? parseFloat(preco.replace(',', '.')) : null;
    const custoValue = custo ? parseFloat(custo.replace(',', '.')) : null;

    // Pacote de dados principal do item
    const itemData = {
        codigo: codigo.trim() || null,
        descricao: descricao.trim(),
        preco: precoValue,
        custo: custoValue,
        foto_url: fotoUrl.trim() || null,
        unidade: unidade.trim() || null,
    };

    try {
        let query;

        // Caso 1: Editando um item existente
        if (editingItem) {
            // Caso 1.1: O TIPO MUDOU! (ex: de Produto para Serviço)
            if (editingItem.type !== itemType) {
                console.log(`TIPO ALTERADO: De ${editingItem.type} para ${itemType}. Movendo item...`);
                
                // Chamamos a função especial (RPC) que criamos no Supabase
                query = supabase.rpc('mover_item', {
                    p_old_id: editingItem.id,
                    p_old_type: editingItem.type,
                    p_new_data: itemData
                });

            } else {
            // Caso 1.2: O tipo não mudou, é um UPDATE normal
                console.log("Tipo não mudou. Fazendo UPDATE normal...");
                const tableName = itemType === 'produto' ? 'produtos' : 'servicos';
                const idColumn = itemType === 'produto' ? 'idproduto' : 'idservico';
                query = supabase.from(tableName).update(itemData).eq(idColumn, editingItem.id);
            }
        } 
        // Caso 2: Criando um item NOVO
        else {
            console.log("Criando item novo...");
            const tableName = itemType === 'produto' ? 'produtos' : 'servicos';
            query = supabase.from(tableName).insert(itemData); // O Supabase preencherá user_id e empresa_id automaticamente
        }

        // Executa a operação (seja UPDATE, INSERT ou RPC)
        const { error } = await query;
        if (error) throw error;
        
        Alert.alert('Sucesso', 'Item salvo com sucesso!');
        closeModal();
        await loadItems();

    } catch (error) {
        console.error('Erro ao salvar item:', error);
        Alert.alert('Erro ao Salvar', `Não foi possível salvar o item. Detalhes: ${error.message}`);
    }
};
    const deleteItem = (item) => {
        Alert.alert(
            'Confirmar Exclusão',
            `Deseja realmente excluir "${item.descricao}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        const tableName = item.type === 'produto' ? 'produtos' : 'servicos';
                        const idColumn = item.type === 'produto' ? 'idproduto' : 'idservico';

                        try {
                            const { error } = await supabase.from(tableName).delete().eq(idColumn, item.id);
                            if (error) throw error;
                            Alert.alert('Sucesso', 'Item excluído com sucesso!');
                            await loadItems();
                        } catch (error) {
                            console.error(`Erro ao excluir de ${tableName}:`, error);
                            Alert.alert('Erro', 'Não foi possível excluir o item.');
                        }
                    }
                }
            ]
        );
    };

    const handleComposition = () => {
    if (!editingItem) {
        Alert.alert(
            'Atenção',
            'Você precisa primeiro salvar o item antes de gerenciar sua composição.'
        );
        return;
    }

    // Fecha o modal antes de navegar para a próxima tela
    closeModal();

    // Navega para a tela de composição, passando os dados do item como parâmetros
    router.push({
        pathname: '/composition',
        params: { 
            itemId: editingItem.id, 
            itemType: editingItem.type,
            itemDescricao: editingItem.descricao
        },
    });
};

    const formatPrice = (price) => {
        if (price === null || price === undefined) return 'R$ 0,00';
        return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
    };

    const renderItem = ({ item }) => (
        <View style={styles.itemCard}>
            <Image
                style={styles.itemImage}
                source={item.foto_url ? { uri: item.foto_url } : require('../assets/images/adaptive-icon.png')}
            />
            <View style={styles.itemInfo}>
                <Text style={styles.itemDescription} numberOfLines={2}>{item.descricao}</Text>
                {item.codigo && (
                    <Text style={styles.itemCode}>Código: {item.codigo}</Text>
                )}
                <Text style={styles.itemPrice}>{formatPrice(item.preco)}</Text>
            </View>
            <View style={styles.itemActions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => openModal(item)}
                >
                    <Text style={styles.actionButtonText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => deleteItem(item)}
                >
                    <Text style={styles.actionButtonText}>🗑️</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <ThemedView style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por descrição..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor={colors.textLight}
                />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Carregando...</Text>
                </View>
            ) : items.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Nenhum item cadastrado</Text>
                    <Text style={styles.emptySubtext}>Toque em &quot;Adicionar&quot; para cadastrar seu primeiro item</Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={(item) => `${item.type}-${item.id}`}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ThemedText type="subtitle" style={styles.modalTitle}>
                            {editingItem ? 'Editar Item' : 'Novo Item'}
                        </ThemedText>

                        <View style={styles.typeSelectorContainer}>
                            <TouchableOpacity
                                style={[styles.typeButton, itemType === 'produto' && styles.typeButtonActive]}
                                onPress={() => setItemType('produto')}
                            >
                                <Text style={[styles.typeButtonText, itemType === 'produto' && styles.typeButtonTextActive]}>Produto</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeButton, itemType === 'serviço' && styles.typeButtonActive]}
                                onPress={() => setItemType('serviço')}
                            >
                                <Text style={[styles.typeButtonText, itemType === 'serviço' && styles.typeButtonTextActive]}>Serviço</Text>
                            </TouchableOpacity>
                        </View>

                        {fotoUrl ? (
                            <Image source={{ uri: fotoUrl }} style={styles.modalImage} />
                        ) : (
                            <View style={styles.modalImagePlaceholder}>
                                <Text style={{ color: colors.textLight }}>Sem Imagem</Text>
                            </View>
                        )}

                        <TextInput
                            style={styles.input}
                            placeholder="URL da Foto"
                            value={fotoUrl}
                            onChangeText={setFotoUrl}
                            placeholderTextColor={colors.textLight}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Código (opcional)"
                            value={codigo}
                            onChangeText={setCodigo}
                            placeholderTextColor={colors.textLight}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Descrição *"
                            value={descricao}
                            onChangeText={setDescricao}
                            placeholderTextColor={colors.textLight}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Custo (ex: 5.25)"
                            value={custo}
                            onChangeText={setCusto}
                            keyboardType="numeric"
                            placeholderTextColor={colors.textLight}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Preço de Venda (ex: 10.50)"
                            value={preco}
                            onChangeText={setPreco}
                            keyboardType="numeric"
                            placeholderTextColor={colors.textLight}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Unidade de medida (ex: UN, KG, M)"
                            value={unidade}
                            onChangeText={setUnidade}
                            placeholderTextColor={colors.textLight}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity
                            style={[
                            styles.compositionButton,
                            !editingItem && { backgroundColor: '#a9a9a9' } // Estilo quando desabilitado
                            ]}
                            onPress={handleComposition}
                            disabled={!editingItem}>
                            <Text style={styles.compositionButtonText}>🛠️ Gerenciar Composição</Text>
                        </TouchableOpacity>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={closeModal}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={saveItem}
                            >
                                <Text style={styles.saveButtonText}>
                                    {editingItem ? 'Atualizar' : 'Salvar'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ThemedView>
    );
}