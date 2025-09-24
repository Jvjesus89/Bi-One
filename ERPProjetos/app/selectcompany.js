import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';

import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

const getStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        padding: 24,
    },
    content: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 24,
        maxHeight: '80%',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24,
        color: colors.text,
    },
    card: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardText: {
        fontSize: 18,
        fontWeight: '500',
        color: colors.text,
        textAlign: 'center',
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
});

export default function SelectCompanyScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const styles = useMemo(() => getStyles(colors), [colorScheme]);
    const router = useRouter();
    const { userId } = useLocalSearchParams();

    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompanies = async () => {
            if (!userId) {
                Alert.alert('Erro', 'Nenhum utilizador identificado.');
                router.replace('/login');
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('membros_empresa')
                    .select('empresa_id, empresas ( nome )')
                    .eq('user_id', userId);

                if (error) throw error;
                setCompanies(data || []);
            } catch (error) {
                Alert.alert('Erro', 'Não foi possível carregar as suas empresas.');
            } finally {
                setLoading(false);
            }
        };

        fetchCompanies();
    }, [userId]);

    const handleSelectCompany = (companyId) => {
        // No futuro, aqui iremos guardar a companyId selecionada num contexto global.
        console.log(`Empresa selecionada: ${companyId}`);
        Alert.alert('Sucesso', 'Empresa selecionada. A aplicação irá agora carregar os seus dados.');
        router.replace('/(tabs)');
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Selecione a Empresa</Text>
                <FlatList
                    data={companies}
                    keyExtractor={(item) => String(item.empresa_id)}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={styles.card}
                            onPress={() => handleSelectCompany(item.empresa_id)}
                        >
                            <Text style={styles.cardText}>{item.empresas.nome}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </View>
    );
}
