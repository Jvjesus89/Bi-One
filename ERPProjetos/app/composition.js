import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { supabase } from '@/lib/supabase';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function CompositionScreen() {
    const { itemId, itemType, itemDescricao } = useLocalSearchParams();

    // Estados da tela principal
    const [loading, setLoading] = useState(true);
    const [currentComposition, setCurrentComposition] = useState([]);
    const [availableMaterials, setAvailableMaterials] = useState([]);

    // Estados do Modal
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const isService = itemType === 'serviço';
    const headerTitle = isService ? 'Produtos Utilizados' : 'Matérias-Primas Utilizadas';
    const emptyMessage = isService ? 'Nenhum produto adicionado.' : 'Nenhuma matéria-prima adicionada.';
    const addButtonLabel = isService ? '+ Adicionar Produto' : '+ Adicionar Matéria-Prima';

    const loadCompositionData = useCallback(async () => {
        console.log(`Carregando composição para o item ID: ${itemId}`);
        setLoading(true);
        try {
            const filterField = isService ? 'idservico' : 'idprodutoacabado';

            const [compositionRes, materialsRes] = await Promise.all([
                supabase
                    .from('composicao')
                    .select('*, produtomp:produtos!idprodutomp(descricao)')
                    .eq(filterField, itemId),
                supabase.from('produtos').select('*').order('descricao')
            ]);

            if (compositionRes.error) throw compositionRes.error;
            if (materialsRes.error) throw materialsRes.error;

            console.log(`Encontrado ${compositionRes.data.length} itens na composição.`);
            setCurrentComposition(compositionRes.data || []);
            setAvailableMaterials(materialsRes.data || []);
        } catch (error) {
            console.error("Erro ao buscar dados da composição:", error);
            Alert.alert("Erro", "Não foi possível carregar os dados da composição.");
        } finally {
            setLoading(false);
        }
    }, [itemId, isService]);

    // Hook para recarregar os dados toda vez que a tela ganhar foco
    useFocusEffect(
        useCallback(() => {
            loadCompositionData();
        }, [loadCompositionData])
    );

    const handleAddMaterial = () => {
        setSelectedMaterial(null);
        setQuantity('');
        setSearchQuery('');
        setIsModalVisible(true);
    };

    const handleRemoveMaterial = (compositionId) => {
        Alert.alert(
            "Confirmar Exclusão",
            "Deseja realmente remover este item da composição?",
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('composicao')
                                .delete()
                                .eq('idcomposicao', compositionId);

                            if (error) throw error;

                            Alert.alert("Sucesso", "Item removido com sucesso!");
                            loadCompositionData();
                        } catch (error) {
                            Alert.alert("Erro", `Não foi possível remover o item. Motivo: ${error.message}`);
                            console.error("Erro ao remover item:", error);
                        }
                    },
                },
            ]
        );
    };

    const handleSaveCompositionItem = async () => {
        if (!selectedMaterial) {
            return Alert.alert("Erro", "Por favor, selecione um material.");
        }
        const qtyValue = parseFloat(quantity.replace(',', '.'));
        if (isNaN(qtyValue) || qtyValue <= 0) {
            return Alert.alert("Erro", "Por favor, insira uma quantidade válida.");
        }

        const newCompositionItem = {
            idservico: isService ? itemId : null,
            idprodutoacabado: !isService ? itemId : null,
            idprodutomp: selectedMaterial.idproduto,
            qtde: qtyValue,
        };

        const { error } = await supabase.from('composicao').insert(newCompositionItem);

        if (error) {
            Alert.alert("Erro", "Não foi possível adicionar o item à composição.");
            console.error("Erro ao salvar composição:", error);
        } else {
            Alert.alert("Sucesso", "Item adicionado com sucesso!");
            setIsModalVisible(false);
            loadCompositionData();
        }
    };

    const filteredMaterials = useMemo(() => {
        if (!searchQuery) return availableMaterials;
        return availableMaterials.filter(material =>
            material.descricao.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, availableMaterials]);

    const renderCompositionItem = ({ item }) => (
        <View style={styles.itemCard}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemDescription}>{item.produtomp?.descricao || 'Produto não encontrado'}</Text>
                <Text style={styles.itemQuantity}>Quantidade: {item.qtde}</Text>
            </View>
            <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveMaterial(item.idcomposicao)}
            >
                <Text style={styles.removeButtonText}>🗑️</Text>
            </TouchableOpacity>
        </View>
    );

    const renderMaterialSelectItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.modalItem,
                selectedMaterial?.idproduto === item.idproduto && styles.modalItemSelected
            ]}
            onPress={() => setSelectedMaterial(item)}
        >
            <Text style={styles.modalItemText}>{item.descricao}</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
                <ThemedText>Carregando composição...</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: `Composição de ${itemDescricao || 'Item'}` }} />

            <FlatList
                data={currentComposition}
                renderItem={renderCompositionItem}
                keyExtractor={(item) => item.idcomposicao.toString()}
                contentContainerStyle={styles.listContainer}
                ListHeaderComponent={<ThemedText type="subtitle" style={styles.headerText}>{headerTitle}</ThemedText>}
                ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>{emptyMessage}</Text></View>}
            />

            <TouchableOpacity style={styles.addButton} onPress={handleAddMaterial}>
                <Text style={styles.addButtonText}>{addButtonLabel}</Text>
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Adicionar {isService ? 'Produto' : 'Matéria-Prima'}</Text>

                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar material..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />

                        <FlatList
                            data={filteredMaterials}
                            renderItem={renderMaterialSelectItem}
                            keyExtractor={(item) => item.idproduto.toString()}
                            style={styles.modalList}
                        />

                        <TextInput
                            style={styles.quantityInput}
                            placeholder="Quantidade"
                            value={quantity}
                            onChangeText={setQuantity}
                            keyboardType="numeric"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setIsModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveCompositionItem}>
                                <Text style={styles.saveButtonText}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { padding: 16 },
    headerText: { marginBottom: 16, textAlign: 'center' },
    itemCard: { backgroundColor: 'white', borderRadius: 8, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    itemInfo: { flex: 1 },
    itemDescription: { fontSize: 16, fontWeight: '600', color: '#333' },
    itemQuantity: { fontSize: 14, color: '#666', marginTop: 4 },
    removeButton: { padding: 8 },
    removeButtonText: { fontSize: 20 },
    emptyContainer: { marginTop: 50, alignItems: 'center' },
    emptyText: { fontSize: 16, color: '#888' },
    addButton: { backgroundColor: '#007BFF', margin: 16, padding: 16, borderRadius: 8, alignItems: 'center' },
    addButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', backgroundColor: 'white', borderRadius: 16, padding: 20, maxHeight: '80%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
    searchInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
    modalList: { maxHeight: 200 },
    modalItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalItemSelected: { backgroundColor: '#e0f7ff' },
    modalItemText: { fontSize: 16 },
    quantityInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginTop: 16, fontSize: 16 },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 20 },
    modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: '#f0f0f0' },
    cancelButtonText: { color: '#333', fontWeight: '500' },
    saveButton: { backgroundColor: '#007BFF' },
    saveButtonText: { color: 'white', fontWeight: '500' },
});