import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { useFocusEffect, useNavigation } from 'expo-router';
import * as Sharing from 'expo-sharing';

import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerRight: { paddingRight: 5 },
    listContainer: { padding: 16 },
    saleCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    saleInfo: { flex: 1 },
    saleName: { fontSize: 16, fontWeight: '600', color: colors.text },
    saleExtraInfo: { fontSize: 14, color: colors.textLight, marginTop: 4 },
    saleValue: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 8 },
    
    // ESTILOS DO MODAL PRINCIPAL
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }, // Fundo semi-transparente
    modalContent: { backgroundColor: colors.background, borderRadius: 16, padding: 24, width: '90%', maxWidth: 500, maxHeight: '90%' },
    modalTitle: { textAlign: 'center', marginBottom: 20, fontSize: 20, fontWeight: 'bold', color: colors.text },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16, color: colors.text, backgroundColor: colors.card }, // Fundo do input adaptado
    gridHeader: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
    itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    itemText: { 
        fontSize: 15, 
        flex: 1, 
        color: colors.text, // Certifique-se que colors.text seja uma cor clara se o fundo for escuro
        // Adicione sombra para melhor contraste se necessário
        textShadowColor: colors.background === '#fff' ? '#000' : '#fff',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    itemActions: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8, 
        marginLeft: 12,
        minWidth: 120, // Aumenta o espaço do quadrado de valor
    },
    removeItemBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#dc3545', borderRadius: 6 },
    removeItemText: { color: colors.white, fontWeight: '600' },
    qtyInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8, width: 60, color: colors.text, backgroundColor: colors.card, textAlign: 'center' },
    totalContainer: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border },
    totalText: { textAlign: 'right', fontSize: 18, fontWeight: 'bold', color: colors.text },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
    modalButton: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: colors.secondaryBackground, borderWidth: 1, borderColor: colors.border }, // Ajuste para o botão cancelar
    saveButton: { backgroundColor: colors.primary },
    cancelButtonText: { color: colors.text, fontSize: 16, fontWeight: '600' }, // Cor do texto do botão cancelar
    saveButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
    
    // Estilos das sugestões de cliente
    suggestionsContainer: { maxHeight: 180, borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginTop: -8, backgroundColor: colors.card },
    suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    suggestionText: { color: colors.text }, // Cor do texto da sugestão
    clientActionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    linkButton: { paddingVertical: 8, paddingHorizontal: 10 },
    linkButtonText: { color: colors.primary, fontWeight: '600' },
    
    // Estilos dos botões de seleção de tipo de item
    selectionButtonsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 16 },
    selectionButton: { backgroundColor: colors.primary,paddingLeft: 37, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', flex: 1, marginHorizontal: 8,height: 60 ,justifyContent: 'center'},
    selectionButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
    
    // Estilos da área de revisão de itens
    itemsReviewContainer: { marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 },
    scrollableItemsList: { maxHeight: 150, marginBottom: 10 },
    
    // Estilos do botão de incluir item no modal de seleção
    includeButton: { backgroundColor: colors.primary, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6 },
    includeButtonText: { color: colors.white, fontWeight: '500' },
    sectionHeader: { paddingVertical: 6, paddingHorizontal: 8, backgroundColor: colors.secondaryBackground, borderRadius: 6, marginTop: 8, marginBottom: 4 },
    sectionHeaderText: { color: colors.text, fontWeight: '700' },
});

export default function SalesScreen() {
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const styles = useMemo(() => getStyles(colors), [colors]);

    const { activeCompany } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [sales, setSales] = useState([]);

    // Estado para o modal principal de novo orçamento
    const [modalVisible, setModalVisible] = useState(false);
    const [obraNome, setObraNome] = useState('');
    const [saleItems, setSaleItems] = useState([]); // Itens do orçamento atual
    const [editingSaleId, setEditingSaleId] = useState(null);
    const [isFinalized, setIsFinalized] = useState(false);
    
    // Opções de produtos/serviços/clientes do banco
    const [productsOptions, setProductsOptions] = useState([]);
    const [servicesOptions, setServicesOptions] = useState([]);
    const [clientesOptions, setClientesOptions] = useState([]);
    
    // Estado para a seleção de cliente
    const [clienteInput, setClienteInput] = useState('');
    const [filteredClientes, setFilteredClientes] = useState([]);
    const [selectedCliente, setSelectedCliente] = useState(null);
    // Modal interno de cadastro de cliente
    const [clientModalVisible, setClientModalVisible] = useState(false);
    const [novoClienteRazao, setNovoClienteRazao] = useState('');
    const [novoClienteContato, setNovoClienteContato] = useState('');
    const [novoClienteTelefone, setNovoClienteTelefone] = useState('');
    const [novoClienteEmail, setNovoClienteEmail] = useState('');
    const [novoClienteEndereco, setNovoClienteEndereco] = useState('');
    const [novoClienteCpfCnpj, setNovoClienteCpfCnpj] = useState('');
    const [savingCliente, setSavingCliente] = useState(false);

    // Estado para o modal de seleção de produtos/serviços
    const [itemSelectionModalVisible, setItemSelectionModalVisible] = useState(false);
    const [selectionType, setSelectionType] = useState('produto'); // 'produto' ou 'servico'
    const [searchItemQuery, setSearchItemQuery] = useState('');
    
    const saleTotal = useMemo(() => saleItems.reduce((acc, item) => acc + (item.subtotal || 0), 0), [saleItems]);

    // Abre o modal de novo orçamento e reseta os estados
    const openNewSaleModal = useCallback(() => {
        setObraNome('');
        setSaleItems([]);
        setClienteInput('');
        setSelectedCliente(null);
        setFilteredClientes([]);
        setModalVisible(true);
        setEditingSaleId(null);
        setIsFinalized(false);
    }, []);
    
    // Configura o cabeçalho da tela (botão "+ Novo")
    useLayoutEffect(() => {
        navigation.setOptions({
            title: 'Vendas / Orçamentos',
            headerRight: () => (
                <TouchableOpacity onPress={openNewSaleModal} style={styles.headerRight}>
                    <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>+ Novo</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, colors, openNewSaleModal, styles.headerRight]);

    // Carrega dados iniciais (vendas, produtos, serviços, clientes)
    const loadData = useCallback(async (companyId) => {
        if (!companyId) return;
        setLoading(true);
        try {
            const [salesRes, productsRes, servicesRes, clientesRes] = await Promise.all([
                supabase.from('vendas').select('*, clientes(razao)').eq('empresa_id', companyId).order('dtvenda', { ascending: false }),
                supabase.from('produtos').select('*').eq('empresa_id', companyId).order('descricao'),
                supabase.from('servicos').select('*').eq('empresa_id', companyId).order('descricao'),
                supabase.from('clientes').select('*').eq('empresa_id', companyId).order('razao'),
            ]);

            if (salesRes.error) throw salesRes.error;
            if (productsRes.error) throw productsRes.error;
            if (servicesRes.error) throw servicesRes.error;
            if (clientesRes.error) throw clientesRes.error;
            
            setSales(salesRes.data || []);
            setProductsOptions(productsRes.data || []);
            setServicesOptions(servicesRes.data || []);
            setClientesOptions(clientesRes.data || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            Alert.alert('Erro', 'Não foi possível carregar os dados.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Recarrega os dados quando a tela é focada ou a empresa ativa muda
    useFocusEffect(useCallback(() => {
        if (activeCompany?.id) { loadData(activeCompany.id); }
    }, [activeCompany, loadData]));

    // Lida com a mudança do input de cliente e filtra sugestões
    const handleClienteInputChange = (text) => {
        setClienteInput(text);
        setSelectedCliente(null);
        if (text) {
            setFilteredClientes(clientesOptions.filter(c => c.razao.toLowerCase().includes(text.toLowerCase())));
        } else {
            setFilteredClientes([]);
        }
    };

    // Seleciona um cliente da lista de sugestões
    const handleSelectCliente = (cliente) => {
        setSelectedCliente(cliente);
        setClienteInput(cliente.razao);
        setFilteredClientes([]);
    };
    
    // **FUNÇÃO AJUSTADA**: Adiciona um item (Produto ou Serviço) à lista temporária do orçamento
    const handleAddItem = useCallback(async (item, type) => {
        if (type === 'produto') {
            const productItem = {
                id: item.idproduto,
                type: 'produto',
                descricao: item.descricao,
                qtde: 1,
                vlrunit: item.preco || 0,
                subtotal: (1 * (item.preco || 0))
            };
            setSaleItems(prevItems => [...prevItems, productItem]);
            return;
        }

        if (type === 'servico') {
            // Adiciona o serviço
            const serviceItem = {
                id: item.idservico,
                type: 'servico',
                descricao: item.descricao,
                qtde: 1,
                vlrunit: item.preco || 0,
                subtotal: (1 * (item.preco || 0))
            };

            // Busca a composição do serviço e adiciona automaticamente os produtos
            try {
                const { data: composition, error } = await supabase
                    .from('composicao')
                    .select('idprodutomp, qtde')
                    .eq('idservico', item.idservico);

                if (error) throw error;

                const composedProductItems = (composition || []).map(comp => {
                    const product = productsOptions.find(p => p.idproduto === comp.idprodutomp);
                    const unitPrice = product?.preco || 0;
                    const quantity = comp.qtde || 1;
                    return {
                        id: comp.idprodutomp,
                        type: 'produto',
                        descricao: product?.descricao || `Produto ${comp.idprodutomp}`,
                        qtde: quantity,
                        vlrunit: unitPrice,
                        subtotal: quantity * unitPrice,
                        parentServiceId: serviceItem.id,
                        baseQtyPerService: quantity
                    };
                });

                setSaleItems(prevItems => [...prevItems, serviceItem, ...composedProductItems]);
            } catch (_error) {
                // Em caso de erro, adiciona apenas o serviço
                setSaleItems(prevItems => [...prevItems, serviceItem]);
            }
            return;
        }
    }, [productsOptions]);

    // Finaliza o orçamento, salvando no Supabase
    const handleFinalize = async () => {
        if (!obraNome.trim()) return Alert.alert("Atenção", "Por favor, preencha o Nome da Obra/Venda.");
        if (saleItems.length === 0) return Alert.alert("Atenção", "Adicione pelo menos um item.");
        
        setIsSaving(true);
        try {
            let idvendaToUse = editingSaleId;
            const todayStr = isFinalized ? new Date().toISOString().slice(0, 10) : null; // YYYY-MM-DD
            if (editingSaleId) {
                const updateData = { nome_obra: obraNome, valortotal: saleTotal, idcliente: selectedCliente ? selectedCliente.idcliente : null, dtfinalizacao: todayStr };
                const { error: updateError } = await supabase.from('vendas').update(updateData).eq('idvenda', editingSaleId);
                if (updateError) throw updateError;
                // remove itens antigos
                const { error: delError } = await supabase.from('vendaitens').delete().eq('idvenda', editingSaleId);
                if (delError) throw delError;
            } else {
                const saleData = { nome_obra: obraNome, valortotal: saleTotal, idcliente: selectedCliente ? selectedCliente.idcliente : null, empresa_id: activeCompany.id, dtfinalizacao: todayStr };
                const { data: newSale, error: saleError } = await supabase.from('vendas').insert(saleData).select('idvenda').single();
                if (saleError) throw saleError;
                idvendaToUse = newSale.idvenda;
            }
            
            // **LÓGICA AJUSTADA**: Mapeia saleItems para vendaitens, preenchendo idproduto ou idservico
            const itemsToInsert = saleItems.map(item => ({
                idvenda: idvendaToUse,
                idproduto: item.type === 'produto' ? item.id : null,
                idservico: item.type === 'servico' ? item.id : null,
                qtde: item.qtde,
                vlrunit: item.vlrunit,
                empresa_id: activeCompany.id
            }));
            const { error: itemsError } = await supabase.from('vendaitens').insert(itemsToInsert);
            if (itemsError) throw itemsError;

            Alert.alert("Sucesso", "Orçamento salvo com sucesso!");
            setModalVisible(false);
            setEditingSaleId(null);
            loadData(activeCompany.id); // Recarrega os dados para exibir o novo orçamento
        } catch (error) {
            console.error("Erro ao finalizar:", error);
            Alert.alert("Erro", `Não foi possível salvar: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteCurrentSale = useCallback(async () => {
        if (!editingSaleId) return;
        try {
            setIsSaving(true);
            const { error: delItems } = await supabase
                .from('vendaitens')
                .delete()
                .eq('idvenda', editingSaleId)
                .eq('empresa_id', activeCompany.id);
            if (delItems) throw delItems;
            const { error: delSale } = await supabase
                .from('vendas')
                .delete()
                .eq('idvenda', editingSaleId)
                .eq('empresa_id', activeCompany.id);
            if (delSale) throw delSale;
            setModalVisible(false);
            setEditingSaleId(null);
            await loadData(activeCompany.id);
            Alert.alert('Sucesso', 'Orçamento excluído.');
        } catch (_error) {
            Alert.alert('Erro', 'Não foi possível excluir o orçamento.');
        } finally {
            setIsSaving(false);
        }
    }, [editingSaleId, activeCompany, loadData]);

    // Abre o modal de seleção de produtos/serviços
    const openItemSelectionModal = (type) => {
        setSelectionType(type);
        setSearchItemQuery('');
        setItemSelectionModalVisible(true);
    };

    // Adiciona o item selecionado no segundo modal e o fecha
    const handleSelectItemAndClose = async (item, type) => {
        await handleAddItem(item, type);
        setItemSelectionModalVisible(false);
    };

    // Filtra produtos ou serviços no modal de seleção
    const filteredSelectionItems = useMemo(() => {
        const sourceList = selectionType === 'produto' ? productsOptions : servicesOptions;
        if (!searchItemQuery) return sourceList;
        return sourceList.filter(item => item.descricao.toLowerCase().includes(searchItemQuery.toLowerCase()));
    }, [searchItemQuery, selectionType, productsOptions, servicesOptions]);

    const saleItemSections = useMemo(() => {
        const services = saleItems.filter(i => i.type === 'servico');
        const products = saleItems.filter(i => i.type === 'produto');
        const sections = [];
        if (services.length) sections.push({ title: 'Serviços', data: services });
        if (products.length) sections.push({ title: 'Produtos', data: products });
        return sections;
    }, [saleItems]);

    const servicesTotal = useMemo(() => saleItems.filter(i => i.type === 'servico').reduce((a, b) => a + (b.subtotal || 0), 0), [saleItems]);
    const productsTotal = useMemo(() => saleItems.filter(i => i.type === 'produto').reduce((a, b) => a + (b.subtotal || 0), 0), [saleItems]);

const buildPdfHtml = useCallback(
  (logoBase64) => {
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const imgTag = logoBase64
      ? `<div style="text-align:center; margin-bottom: 20px;"><img src="data:image/png;base64,${logoBase64}" alt="Logo" style="max-width:200px;" /></div>`
      : '';

    const servicesRows = saleItems
      .filter(i => i.type === 'servico')
      .map(i => `
        <tr>
          <td style="padding:6px;border:1px solid #ddd;">${i.descricao}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:center;">${i.unidade ?? ''}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:center;">${i.qtde ?? 0}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:right;">R$ ${(i.vlrunit || 0).toFixed(2).replace('.', ',')}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:right;">R$ ${(i.subtotal || 0).toFixed(2).replace('.', ',')}</td>
        </tr>`).join('');

    const productsRows = saleItems
      .filter(i => i.type === 'produto')
      .map(i => `
        <tr>
          <td style="padding:6px;border:1px solid #ddd;">${i.descricao}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:center;">${i.unidade ?? ''}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:center;">${i.qtde ?? 0}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:right;">R$ ${(i.vlrunit || 0).toFixed(2).replace('.', ',')}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:right;">R$ ${(i.subtotal || 0).toFixed(2).replace('.', ',')}</td>
        </tr>`).join('');

    const tax = productsTotal * 0.13;
    const grand = servicesTotal + productsTotal + tax;

    return `
      <html>
      <head><meta charset="utf-8" />
      <style>
        body{ font-family: Arial, sans-serif; padding:16px; }
        h1{ text-align:center; margin:0 0 12px; }
        h2{ margin:16px 0 8px; }
        table{ width:100%; border-collapse:collapse; font-size:12px; }
        .header td{ padding:4px; }
        .total{ font-weight:bold; }
        .right{ text-align:right; }
      </style></head>
      <body>
        ${imgTag}
        <h1>Planilha de serviços</h1>
        <table class="header">
          <tr><td><b>OBRA:</b> ${obraNome || '-'}</td><td class="right"><b>DATA:</b> ${dateStr}</td></tr>
          <tr><td><b>ENDEREÇO:</b> ${selectedCliente?.endereco || '-'}</td><td></td></tr>
          <tr><td><b>CLIENTE:</b> ${selectedCliente?.razao || '-'}</td><td></td></tr>
        </table>
        <h2>Mão de Obra</h2>
        <table>
          <thead>
            <tr>
              <th style="text-align:left;border:1px solid #ddd;padding:6px;">Descrição, Mão de Obra</th>
              <th style="text-align:left;border:1px solid #ddd;padding:6px;">Unid.</th>
              <th style="text-align:center;border:1px solid #ddd;padding:6px;">Quant.</th>
              <th style="text-align:right;border:1px solid #ddd;padding:6px;">V. Unitário</th>
              <th style="text-align:right;border:1px solid #ddd;padding:6px;">V. Total</th>
            </tr>
          </thead>
          <tbody>${servicesRows || `<tr><td colspan="5" style="padding:8px;border:1px solid #ddd;text-align:center;color:#888;">Sem serviços</td></tr>`}</tbody>
          <tfoot>
            <tr class="total"><td colspan="4" style="padding:6px;border:1px solid #ddd;text-align:right;">total</td><td style="padding:6px;border:1px solid #ddd;text-align:right;">R$ ${servicesTotal.toFixed(2).replace('.', ',')}</td></tr>
          </tfoot>
        </table>
        <h2>Material</h2>
        <table>
          <thead>
            <tr>
              <th style="text-align:left;border:1px solid #ddd;padding:6px;">Descrição material</th>
              <th style="text-align:left;border:1px solid #ddd;padding:6px;">Unid.</th>
              <th style="text-align:center;border:1px solid #ddd;padding:6px;">Quant.</th>
              <th style="text-align:right;border:1px solid #ddd;padding:6px;">V. Unitário</th>
              <th style="text-align:right;border:1px solid #ddd;padding:6px;">V. Total</th>
            </tr>
          </thead>
          <tbody>${productsRows || `<tr><td colspan="5" style="padding:8px;border:1px solid #ddd;text-align:center;color:#888;">Sem materiais</td></tr>`}</tbody>
          <tfoot>
            <tr class="total"><td colspan="4" style="padding:6px;border:1px solid #ddd;text-align:right;">total</td><td style="padding:6px;border:1px solid #ddd;text-align:right;">R$ ${productsTotal.toFixed(2).replace('.', ',')}</td></tr>
            <tr class="total"><td colspan="4" style="padding:6px;border:1px solid #ddd;text-align:right;">13% de imposto</td><td style="padding:6px;border:1px solid #ddd;text-align:right;">R$ ${tax.toFixed(2).replace('.', ',')}</td></tr>
          </tfoot>
        </table>
        <h2>Total da nota</h2>
        <table>
          <tr class="total"><td style="padding:10px;border:1px solid #ddd;" class="right">R$ ${grand.toFixed(2).replace('.', ',')}</td></tr>
        </table>
      </body></html>
    `;
  },
  [obraNome, selectedCliente, saleItems, servicesTotal, productsTotal]
);


const exportPdf = useCallback(async () => {
    try {
        let logoBase64 = null;

        // A conversão para Base64 é necessária para o celular (não para a web)
        if (Platform.OS !== 'web') {
            const logoUrl = 'https://drive.google.com/uc?export=view&id=1YaaVmu2qtJC7GYIfoP3vmevyh5vIC4Mu';
            const logoFilePath = FileSystem.cacheDirectory + 'logo_temp.png';

            console.log("Iniciando download da imagem...");
            const downloadedFile = await FileSystem.downloadAsync(logoUrl, logoFilePath);
            console.log("Download completo. URI local:", downloadedFile.uri);

            logoBase64 = await FileSystem.readAsStringAsync(downloadedFile.uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            console.log("Imagem convertida para Base64 com sucesso.");
        }

        // Gera o HTML do PDF
        const html = buildPdfHtml(logoBase64);

        // Gera o PDF a partir do HTML
        const { uri } = await Print.printToFileAsync({ html });
        console.log('PDF gerado com sucesso em:', uri);

        // Compartilha o PDF gerado
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, { dialogTitle: 'Compartilhar Orçamento' });
        } else {
            await Print.printAsync({ uri });
        }

    } catch (err) {
        console.error("ERRO DETALHADO AO EXPORTAR PDF:", err);
        Alert.alert('Erro', `Não foi possível gerar o PDF. Detalhes: ${err.message}`);
    }
}, [buildPdfHtml]);

    const exportCsv = useCallback(async () => {
        if (Platform.OS === 'web') {
            Alert.alert('Indisponível', 'Exportar para Excel/CSV não é suportado no Web nesta versão.');
            return;
        }
        try {
            const toCSV = (rows) => rows.map(r => [r.descricao, r.qtde ?? 0, (r.vlrunit||0).toFixed(2), (r.subtotal||0).toFixed(2)].join(';')).join('\n');
            const header = 'Descricao;Quantidade;VlrUnit;Subtotal';
            const services = saleItems.filter(i => i.type==='servico');
            const products = saleItems.filter(i => i.type==='produto');
            const csv = [
                'Planilha de serviços',
                `Obra;${obraNome || ''}`,
                `Cliente;${selectedCliente?.razao || ''}`,
                '',
                'Serviços',
                header,
                toCSV(services),
                `Total serviços;;;${servicesTotal.toFixed(2)}`,
                '',
                'Materiais',
                header,
                toCSV(products),
                `Total materiais;;;${productsTotal.toFixed(2)}`
            ].join('\n');
            const fileUri = FileSystem.cacheDirectory + `orcamento_${Date.now()}.csv`;
            await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
            await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Exportar CSV', UTI: 'public.comma-separated-values-text' });
        } catch (_e) {
            Alert.alert('Erro', 'Não foi possível gerar o arquivo CSV.');
        }
    }, [saleItems, obraNome, selectedCliente, servicesTotal, productsTotal]);

    // Componente para renderizar cada card de venda na lista principal
    const renderSale = ({ item }) => (
        <TouchableOpacity style={styles.saleCard} onPress={async () => {
            try {
                // Pré-preenche dados básicos
                setEditingSaleId(item.idvenda);
                setObraNome(item.nome_obra || '');
                // Seta cliente selecionado se existir
                const cliente = clientesOptions.find(c => c.idcliente === item.idcliente);
                if (cliente) {
                    setSelectedCliente(cliente);
                    setClienteInput(cliente.razao);
                } else {
                    setSelectedCliente(null);
                    setClienteInput('');
                }
                setIsFinalized(!!item.dtfinalizacao);
                // Carrega itens da venda para edição
                const { data: itens, error } = await supabase
                    .from('vendaitens')
                    .select('idproduto, idservico, qtde, vlrunit')
                    .eq('idvenda', item.idvenda);
                if (error) throw error;
                const mapped = (itens || []).map(it => {
                    const isProduto = !!it.idproduto;
                    const src = isProduto ? productsOptions.find(p => p.idproduto === it.idproduto) : servicesOptions.find(s => s.idservico === it.idservico);
                    const descricao = src?.descricao || (isProduto ? `Produto ${it.idproduto}` : `Serviço ${it.idservico}`);
                    const id = isProduto ? it.idproduto : it.idservico;
                    const type = isProduto ? 'produto' : 'servico';
                    const qtde = it.qtde || 1;
                    const vlrunit = it.vlrunit || 0;
                    return { id, type, descricao, qtde, vlrunit, subtotal: qtde * vlrunit };
                });
                setSaleItems(mapped);
                setModalVisible(true);
            } catch (_error) {
                Alert.alert('Erro', 'Não foi possível abrir o orçamento para edição.');
            }
        }}>
            <View style={styles.cardRow}>
                <View style={styles.saleInfo}>
                    <Text style={styles.saleName}>{item.nome_obra || `Venda #${item.idvenda}`}</Text>
                    <Text style={styles.saleExtraInfo}>
                        Cliente: {item.clientes?.razao || 'Não informado'} | Data: {new Date(item.dtvenda).toLocaleDateString('pt-BR')}
                    </Text>
                </View>
                <Text style={styles.saleValue}>R$ {Number(item.valortotal).toFixed(2).replace('.', ',')}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Lista principal de Vendas/Orçamentos */}
            {loading ? (
                <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>
            ) : (
                <FlatList
                    data={sales}
                    keyExtractor={(item) => String(item.idvenda)}
                    renderItem={renderSale}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>Nenhum Orçamento</Text></View>}
                />
            )}

            {/* Modal para criar/editar um novo orçamento */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <FlatList
                            data={[]} // lista vazia, só para rolagem
                            keyExtractor={(item, index) => index.toString()}
                            ListHeaderComponent={
                                <>
                                    <Text style={styles.modalTitle}>Novo Orçamento</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <TouchableOpacity
                                                onPress={() => setIsFinalized(prev => !prev)}
                                                style={{ width: 22, height: 22, borderRadius: 4, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 8, backgroundColor: isFinalized ? colors.primary : 'transparent' }}
                                            >
                                                {isFinalized && <Text style={{ color: colors.white, fontWeight: '800' }}>✓</Text>}
                                            </TouchableOpacity>
                                            <Text style={{ color: colors.text }}>Finalizado/Aceito</Text>                            
                                    </View>
                                    {/* Input para nome da obra/venda */}
                                    <TextInput style={styles.input} placeholder="Nome da Obra / Venda *" value={obraNome} onChangeText={setObraNome} placeholderTextColor={colors.textLight} />
                                    
                                    {/* Input e lista de clientes */}
                                    <TextInput style={styles.input} placeholder="Pesquisar cliente (opcional)" value={clienteInput} onChangeText={handleClienteInputChange} placeholderTextColor={colors.textLight} />
                                    <View style={styles.clientActionsRow}>
                                        <Text style={{ color: colors.textLight }}>Selecione um cliente abaixo</Text>
                                        <TouchableOpacity style={styles.linkButton} onPress={() => setClientModalVisible(true)}>
                                            <Text style={styles.linkButtonText}>+ Cadastrar Cliente</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.suggestionsContainer}>
                                        {(clienteInput ? filteredClientes : clientesOptions).slice(0, 5).map(c => (
                                            <TouchableOpacity key={c.idcliente} style={styles.suggestionItem} onPress={() => handleSelectCliente(c)}>
                                                <Text style={styles.suggestionText}>{c.razao}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Botões para abrir o modal de seleção de produtos/serviços */}
                                    <View style={styles.selectionButtonsContainer}>
                                        <TouchableOpacity style={styles.selectionButton} onPress={() => openItemSelectionModal('servico')}><Text style={styles.selectionButtonText}>Adicionar Serviço</Text></TouchableOpacity>
                                        <TouchableOpacity style={styles.selectionButton} onPress={() => openItemSelectionModal('produto')}><Text style={styles.selectionButtonText}>Adicionar Produto</Text></TouchableOpacity>
                                    </View>

                                    {/* Seção de revisão dos itens já adicionados ao orçamento */}
                                    <View style={styles.itemsReviewContainer}>
                                        <Text style={styles.gridHeader}>Itens do Orçamento</Text>
                                        {saleItems.length === 0 ? (
                                            <Text style={{textAlign: 'center', color: colors.textLight, marginVertical: 10}}>Nenhum item adicionado</Text>
                                        ) : (
                                            saleItemSections.map(section => (
                                                <View key={section.title}>
                                                    <View style={styles.sectionHeader}><Text style={styles.sectionHeaderText}>{section.title}</Text></View>
                                                    {section.data.map((item, idx) => (
                                                        <View key={`${item.type}-${item.id}-${idx}`} style={styles.itemRow}>
                                                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                                <TextInput
                                                                    style={styles.qtyInput}
                                                                    value={String(item.qtde)}
                                                                    keyboardType="numeric"
                                                                    onChangeText={(text) => {
                                                                        const normalized = text.replace(',', '.');
                                                                        const qty = Math.max(0, parseFloat(normalized || '0'));
                                                                        setSaleItems(prev => {
                                                                            const newItems = prev.map((it, i) => {
                                                                                if (i !== idx) return it;
                                                                                const newQty = isNaN(qty) ? 0 : qty;
                                                                                return { ...it, qtde: newQty, subtotal: (newQty * (it.vlrunit || 0)) };
                                                                            });

                                                                            const changed = newItems[idx];
                                                                            if (changed?.type === 'servico') {
                                                                                for (let i = 0; i < newItems.length; i++) {
                                                                                    const line = newItems[i];
                                                                                    if (line.parentServiceId === changed.id && line.baseQtyPerService != null) {
                                                                                        const childQty = (changed.qtde || 0) * (line.baseQtyPerService || 0);
                                                                                        newItems[i] = { ...line, qtde: childQty, subtotal: (childQty * (line.vlrunit || 0)) };
                                                                                    }
                                                                                }
                                                                            }
                                                                            return newItems;
                                                                        });
                                                                    }}
                                                                />
                                                                <Text style={styles.itemText}>{item.descricao}</Text>
                                                            </View>
                                                            <View style={styles.itemActions}>
                                                                <Text style={styles.itemText}>R$ {(item.subtotal).toFixed(2).replace('.', ',')}</Text>
                                                                <TouchableOpacity
                                                                    style={styles.removeItemBtn}
                                                                    onPress={() => {
                                                                        setSaleItems(prev => prev.filter((_, i) => i !== idx));
                                                                    }}
                                                                >
                                                                    <Text style={styles.removeItemText}>Excluir</Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                    ))}
                                                </View>
                                            ))
                                        )}
                                    </View>
                                </>
                            }
                            ListFooterComponent={
                                <>
                                    <Text style={styles.totalText}>Total: R$ {saleTotal.toFixed(2).replace('.', ',')}</Text>
                                    {/* Botões de ação do modal principal */}
                                    <View style={styles.modalButtons}>
                                        <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}><Text style={styles.cancelButtonText}>Cancelar</Text></TouchableOpacity>
                                        <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleFinalize} disabled={isSaving}><Text style={styles.saveButtonText}>{isSaving ? 'Salvando...' : 'Concluir'}</Text></TouchableOpacity>
                                    </View>
                                    <View style={[styles.modalButtons, { marginTop: 8 }]}>
                                      <TouchableOpacity style={[styles.modalButton, styles.cancelButton, {backgroundColor: '#6c757d'}]} onPress={exportPdf}>
                                       <Text style={styles.cancelButtonText}>Imprimir / PDF</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity style={[styles.modalButton, styles.cancelButton, {backgroundColor: '#198754'}]} onPress={exportCsv}>
                                       <Text style={styles.cancelButtonText}>Exportar Excel (CSV)</Text>
                                      </TouchableOpacity>
                                    </View>
                                    {editingSaleId && (
                                        <View style={[styles.modalButtons, { marginTop: 12 }]}>
                                            <TouchableOpacity
                                                style={[styles.modalButton, { backgroundColor: '#dc3545' }]}
                                                onPress={() => {
                                                    if (Platform.OS === 'web') {
                                                        // Alert com botões não é suportado no web; executa direto
                                                        deleteCurrentSale();
                                                    } else {
                                                        Alert.alert(
                                                            'Excluir Orçamento',
                                                            'Tem certeza que deseja excluir este orçamento? Esta ação não poderá ser desfeita.',
                                                            [
                                                                { text: 'Cancelar', style: 'cancel' },
                                                                { text: 'Excluir', style: 'destructive', onPress: () => { deleteCurrentSale(); } }
                                                            ]
                                                        );
                                                    }
                                                }}
                                            >
                                                <Text style={styles.saveButtonText}>Excluir Orçamento</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </>
                            }
                        />
                    </View>
                </View>
            </Modal>

            {/* Modal para selecionar Produtos ou Serviços */}
            <Modal visible={itemSelectionModalVisible} transparent animationType="slide" onRequestClose={() => setItemSelectionModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Selecione um {selectionType === 'produto' ? 'Produto' : 'Serviço'}</Text>
                        <TextInput style={styles.input} placeholder="Pesquisar..." value={searchItemQuery} onChangeText={setSearchItemQuery} placeholderTextColor={colors.textLight}/>
                        <FlatList
                            data={filteredSelectionItems}
                            keyExtractor={(item) => String(item.idproduto || item.idservico)}
                            renderItem={({ item }) => (
                                <View style={styles.itemRow}>
                                    <Text style={styles.itemText}>{item.descricao}</Text>
                                    <TouchableOpacity style={styles.includeButton} onPress={() => handleSelectItemAndClose(item, selectionType)}>
                                        <Text style={styles.includeButtonText}>Incluir</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                        <TouchableOpacity style={[styles.modalButton, styles.cancelButton, {marginTop: 16}]} onPress={() => setItemSelectionModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal para cadastrar novo cliente (interno) */}
            <Modal visible={clientModalVisible} transparent animationType="slide" onRequestClose={() => setClientModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalTitle}>Cadastrar Cliente</Text>
                            <TextInput style={styles.input} placeholder="Razão / Nome *" value={novoClienteRazao} onChangeText={setNovoClienteRazao} placeholderTextColor={colors.textLight} />
                            <TextInput style={styles.input} placeholder="Contato" value={novoClienteContato} onChangeText={setNovoClienteContato} placeholderTextColor={colors.textLight} />
                            <TextInput style={styles.input} placeholder="Telefone" value={novoClienteTelefone} onChangeText={setNovoClienteTelefone} placeholderTextColor={colors.textLight} keyboardType="phone-pad" />
                            <TextInput style={styles.input} placeholder="E-mail" value={novoClienteEmail} onChangeText={setNovoClienteEmail} placeholderTextColor={colors.textLight} keyboardType="email-address" />
                            <TextInput style={styles.input} placeholder="CPF/CNPJ" value={novoClienteCpfCnpj} onChangeText={setNovoClienteCpfCnpj} placeholderTextColor={colors.textLight} />
                            <TextInput style={styles.input} placeholder="Endereço" value={novoClienteEndereco} onChangeText={setNovoClienteEndereco} placeholderTextColor={colors.textLight} />
                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setClientModalVisible(false)}>
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.saveButton]}
                                    disabled={savingCliente}
                                    onPress={async () => {
                                        if (!novoClienteRazao.trim()) {
                                            return Alert.alert('Atenção', 'Informe a Razão/Nome do cliente.');
                                        }
                                        try {
                                            setSavingCliente(true);
                                            // Busca idusuario vinculado ao auth.user atual (garante userId)
                                            let currentUserId = null;
                                            try {
                                                const { data: authData } = await supabase.auth.getUser();
                                                currentUserId = authData?.user?.id || null;
                                            } catch {}
                                            if (!currentUserId) throw new Error('Usuário autenticado não identificado. Faça login novamente.');

                                            const { data: usuarioRow, error: usuarioError } = await supabase
                                                .from('usuarios')
                                                .select('idusuario')
                                                .eq('user_id', currentUserId)
                                                .eq('empresa_id', activeCompany.id)
                                                .maybeSingle();
                                            if (usuarioError) throw usuarioError;
                                            if (!usuarioRow?.idusuario) throw new Error('Usuário não encontrado para esta empresa.');

                                            const payload = {
                                                razao: novoClienteRazao.trim(),
                                                contato: novoClienteContato.trim() || null,
                                                telefone: novoClienteTelefone.trim() || null,
                                                email: novoClienteEmail.trim() || null,
                                                endereco: novoClienteEndereco.trim() || null,
                                                cpf_cnpj: novoClienteCpfCnpj.trim() || null,
                                                empresa_id: activeCompany.id,
                                                idusuario: usuarioRow.idusuario,
                                            };
                                            const { data, error } = await supabase.from('clientes').insert(payload).select('*').single();
                                            if (error) throw error;
                                            // Atualiza listas e seleciona o novo cliente
                                            setClientesOptions(prev => [data, ...prev].sort((a, b) => a.razao.localeCompare(b.razao)));
                                            setClienteInput(data.razao);
                                            setSelectedCliente(data);
                                            setFilteredClientes([]);
                                            setClientModalVisible(false);
                                            // limpa campos
                                            setNovoClienteRazao('');
                                            setNovoClienteContato('');
                                            setNovoClienteTelefone('');
                                            setNovoClienteEmail('');
                                            setNovoClienteEndereco('');
                                            setNovoClienteCpfCnpj('');
                                            Alert.alert('Sucesso', 'Cliente cadastrado!');
                                        } catch (err) {
                                            console.error('Erro ao salvar cliente:', err);
                                            Alert.alert('Erro', 'Não foi possível salvar o cliente.');
                                        } finally {
                                            setSavingCliente(false);
                                        }
                                    }}
                                >
                                    <Text style={styles.saveButtonText}>{savingCliente ? 'Salvando...' : 'Salvar'}</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}