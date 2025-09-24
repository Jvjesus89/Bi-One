import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerRight: { paddingRight: 5 },
    listContainer: { padding: 16 },
    card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
    name: { fontSize: 16, fontWeight: '600', color: colors.text },
    sub: { fontSize: 14, color: colors.textLight, marginTop: 4 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 8 },
    
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: colors.background, borderRadius: 16, padding: 24, width: '90%', maxWidth: 500, maxHeight: '90%' },
    modalTitle: { textAlign: 'center', marginBottom: 20, fontSize: 20, fontWeight: 'bold', color: colors.text },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16, color: colors.text, backgroundColor: colors.card },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 12 },
    modalButton: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: colors.secondaryBackground, borderWidth: 1, borderColor: colors.border },
    saveButton: { backgroundColor: colors.primary },
    cancelButtonText: { color: colors.text, fontSize: 16, fontWeight: '600' },
    saveButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});

export default function ClientsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const styles = useMemo(() => getStyles(colors), [colors]);

    const { activeCompany, user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState([]);
    const [search, setSearch] = useState('');

    const [modalVisible, setModalVisible] = useState(false);
    const [razao, setRazao] = useState('');
    const [contato, setContato] = useState('');
    const [telefone, setTelefone] = useState('');
    const [email, setEmail] = useState('');
    const [endereco, setEndereco] = useState('');
    const [cpfCnpj, setCpfCnpj] = useState('');

    const loadClients = useCallback(async () => {
        if (!activeCompany?.id) return;
        setLoading(true);
        try {
            let query = supabase.from('clientes').select('*').eq('empresa_id', activeCompany.id).order('razao');
            if (search.trim()) {
                // filtro simples por razão
                // se houver colunas adicionais com índices, pode-se expandir
                query = query.ilike('razao', `%${search.trim()}%`);
            }
            const { data, error } = await query;
            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            Alert.alert('Erro', 'Não foi possível carregar os clientes.');
        } finally {
            setLoading(false);
        }
    }, [activeCompany, search]);

    useFocusEffect(useCallback(() => {
        loadClients();
    }, [loadClients]));

    const openModal = () => {
        setRazao('');
        setContato('');
        setTelefone('');
        setEmail('');
        setEndereco('');
        setCpfCnpj('');
        setModalVisible(true);
    };

    const saveClient = async () => {
        if (!razao.trim()) {
            return Alert.alert('Atenção', 'Informe a Razão/Nome do cliente.');
        }
        try {
            // Garante userId válido (fallback ao auth.getUser)
            let currentUserId = user?.id;
            if (!currentUserId) {
                const { data: authData, error: authErr } = await supabase.auth.getUser();
                if (authErr) throw authErr;
                currentUserId = authData?.user?.id;
            }
            if (!currentUserId) throw new Error('Usuário autenticado não identificado. Faça login novamente.');

            // Busca idusuario vinculado ao auth.user atual
            const { data: usuarioRow, error: usuarioError } = await supabase
                .from('usuarios')
                .select('idusuario')
                .eq('user_id', currentUserId)
                .eq('empresa_id', activeCompany.id)
                .maybeSingle();
            if (usuarioError) throw usuarioError;
            if (!usuarioRow?.idusuario) throw new Error('Usuário não encontrado para esta empresa.');

            const payload = {
                razao: razao.trim(),
                contato: contato.trim() || null,
                telefone: telefone.trim() || null,
                email: email.trim() || null,
                endereco: endereco.trim() || null,
                cpf_cnpj: cpfCnpj.trim() || null,
                empresa_id: activeCompany.id,
                idusuario: usuarioRow.idusuario,
            };
            const { error } = await supabase.from('clientes').insert(payload);
            if (error) throw error;
            Alert.alert('Sucesso', 'Cliente cadastrado com sucesso!');
            setModalVisible(false);
            loadClients();
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            Alert.alert('Erro', `Não foi possível salvar: ${error.message}`);
        }
    };

    const renderClient = ({ item }) => (
        <View style={styles.card}>
            <Text style={styles.name}>{item.razao}</Text>
            <Text style={styles.sub}>{item.contato || item.email || item.telefone || 'Sem contato'}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>
            ) : (
                <>
                    <View style={{ padding: 16 }}>
                        <TextInput style={styles.input} placeholder="Buscar cliente" value={search} onChangeText={setSearch} placeholderTextColor={colors.textLight} />
                        <TouchableOpacity onPress={openModal} style={{ alignSelf: 'flex-end' }}>
                            <Text style={{ color: colors.primary, fontWeight: '600' }}>+ Novo Cliente</Text>
                        </TouchableOpacity>
                    </View>
                    {clients.length === 0 ? (
                        <View style={styles.emptyContainer}><Text style={styles.emptyText}>Nenhum cliente</Text></View>
                    ) : (
                        <FlatList data={clients} keyExtractor={(c) => String(c.idcliente)} renderItem={renderClient} contentContainerStyle={styles.listContainer} />
                    )}
                </>
            )}

            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Cadastrar Cliente</Text>
                        <TextInput style={styles.input} placeholder="Razão / Nome *" value={razao} onChangeText={setRazao} placeholderTextColor={colors.textLight} />
                        <TextInput style={styles.input} placeholder="Contato" value={contato} onChangeText={setContato} placeholderTextColor={colors.textLight} />
                        <TextInput style={styles.input} placeholder="Telefone" value={telefone} onChangeText={setTelefone} placeholderTextColor={colors.textLight} keyboardType="phone-pad" />
                        <TextInput style={styles.input} placeholder="E-mail" value={email} onChangeText={setEmail} placeholderTextColor={colors.textLight} keyboardType="email-address" />
                        <TextInput style={styles.input} placeholder="CPF/CNPJ" value={cpfCnpj} onChangeText={setCpfCnpj} placeholderTextColor={colors.textLight} />
                        <TextInput style={styles.input} placeholder="Endereço" value={endereco} onChangeText={setEndereco} placeholderTextColor={colors.textLight} />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}><Text style={styles.cancelButtonText}>Cancelar</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveClient}><Text style={styles.saveButtonText}>Salvar</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}


