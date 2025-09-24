import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { colors } from '../styles/global';

export default function SignUpScreen() {
    const [usuario, setUsuario] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState(''); // Estado para a mensagem de erro em tela
    const router = useRouter();
    const { signUp } = useAuth();

    // Função para limpar o erro ao digitar
    const handleTextChange = (setter) => (text) => {
        setter(text);
        if (formError) setFormError('');
    };

    async function handleSignUp() {
        setFormError(''); // Limpa erros anteriores
        
        if (!usuario || !email || !password || !confirmPassword) {
            setFormError('Por favor, preencha todos os campos');
            return;
        }
        if (password !== confirmPassword) {
            setFormError('As senhas não coincidem');
            return;
        }
        if (password.length < 6) {
            setFormError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setIsLoading(true);
        
        try {
            const { data, error } = await signUp(email, password, usuario);
            
            if (error) {
                // Verifica se o erro é de um utilizador já existente
                if (error.message && error.message.includes('User already registered')) {
                    setFormError('Este email já está cadastrado. Tente fazer login.');
                } else {
                    setFormError(error.message);
                }
            } else {
                Alert.alert(
                    'Confirmação Necessária', 
                    `Um email de confirmação foi enviado para ${email}. Por favor, verifique a sua caixa de entrada para ativar a sua conta.`,
                    [
                        {
                            text: 'OK',
                            onPress: () => router.replace('/login')
                        }
                    ]
                );
            }
        } catch (error) {
            setFormError('Erro inesperado ao criar conta. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Criar Conta</Text>
                
                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="Nome de usuário"
                        value={usuario}
                        onChangeText={handleTextChange(setUsuario)}
                        autoCapitalize="words"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={handleTextChange(setEmail)}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoComplete="email"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Senha (mínimo 6 caracteres)"
                        value={password}
                        onChangeText={handleTextChange(setPassword)}
                        secureTextEntry
                        autoComplete="new-password"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Confirmar Senha"
                        value={confirmPassword}
                        onChangeText={handleTextChange(setConfirmPassword)}
                        secureTextEntry
                        autoComplete="new-password"
                    />
                    
                    {/* Mensagem de erro em tela */}
                    {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
                    
                    {isLoading ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={styles.loaderText}>Criando conta...</Text>
                        </View>
                    ) : (
                        <TouchableOpacity 
                            style={[styles.button, styles.loginButton]} 
                            onPress={handleSignUp}
                        >
                            <Text style={styles.loginButtonText}>Criar Conta</Text>
                        </TouchableOpacity>
                    )}
                </View>
                
                <TouchableOpacity 
                    style={styles.linkContainer}
                    onPress={() => router.replace('/login')}
                >
                    <Text style={styles.link}>Já tem uma conta? Faça login</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// Estilos consistentes com a tela de Login
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        padding: 24,
    },
    content: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 32,
        elevation: 4,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24,
        color: colors.text,
    },
    form: {
        marginBottom: 24,
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: colors.white,
    },
    loaderContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    loaderText: {
        marginTop: 12,
        fontSize: 16,
        color: colors.textLight,
    },
    button: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginButton: {
        backgroundColor: colors.primary,
    },
    loginButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    linkContainer: {
        alignItems: 'center',
    },
    link: {
        color: colors.primary,
        fontSize: 16,
        textDecorationLine: 'underline',
    },
    errorText: {
        color: colors.danger, // Usando a cor de perigo do seu tema
        textAlign: 'center',
        marginBottom: 16,
        fontSize: 14,
        fontWeight: '500',
    },
});

