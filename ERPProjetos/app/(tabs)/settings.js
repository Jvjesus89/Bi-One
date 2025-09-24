import { useAuth } from '@/hooks/useAuth';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { colors } from '../../styles/global';

export default function SettingsScreen() {
  const { 
    isBiometricSupport, 
    enableBiometrics, 
    disableBiometrics,
    getBiometricCredentials,
    signOut,
    user,
    profile
  } = useAuth();
  
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const supported = await isBiometricSupport();
      const credentials = await getBiometricCredentials();
      setIsSupported(supported);
      setIsEnabled(!!credentials);
    })();
  }, []);

  const handleToggleSwitch = async (value) => {
    if (value) {
      setShowPasswordInput(true);
    } else {
      setIsLoading(true);
      await disableBiometrics();
      setIsEnabled(false);
      setIsLoading(false);
      Alert.alert("Sucesso", "Login por digital desabilitado.");
    }
  };

  const handleEnableBiometrics = async () => {
    if (!password) {
      Alert.alert("Erro", "Por favor, insira sua senha.");
      return;
    }
    
    // Usar o email do usuário logado
    const userEmail = user?.email;
    if (!userEmail) {
      Alert.alert("Erro", "Usuário não encontrado.");
      return;
    }
    
    setIsLoading(true);
    const { error } = await enableBiometrics(userEmail, password);
    setIsLoading(false);
    
    if (error) {
      Alert.alert("Erro", error.message);
    } else {
      setIsEnabled(true);
      setShowPasswordInput(false);
      setPassword('');
      Alert.alert("Sucesso", "Login por digital habilitado!");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Configurações</ThemedText>
      
      {/* Informações do usuário */}
      <View style={styles.userInfo}>
        <ThemedText type="subtitle" style={styles.userName}>
          {profile?.usuario || user?.email}
        </ThemedText>
        <ThemedText style={styles.userEmail}>{user?.email}</ThemedText>
      </View>

      {/* Configuração de autenticação biométrica */}
      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Segurança
        </ThemedText>
        
        {isSupported ? (
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingText}>Login com Digital</Text>
              <Text style={styles.settingDescription}>
                {isEnabled ? 'Habilitado' : 'Desabilitado'}
              </Text>
            </View>
            <Switch
              trackColor={{ false: "#767577", true: colors.primary }}
              thumbColor={isEnabled ? "#f5dd4b" : "#f4f3f4"}
              onValueChange={handleToggleSwitch}
              value={isEnabled}
              disabled={isLoading}
            />
          </View>
        ) : (
          <View style={styles.notSupported}>
            <Text style={styles.notSupportedText}>
              Seu dispositivo não suporta autenticação biométrica
            </Text>
          </View>
        )}

        {showPasswordInput && (
          <View style={styles.passwordContainer}>
            <Text style={styles.passwordLabel}>Confirme sua senha para continuar:</Text>
            <TextInput
              style={styles.input}
              placeholder="Sua senha"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoFocus
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => setShowPasswordInput(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.confirmButton]} 
                onPress={handleEnableBiometrics}
                disabled={isLoading}
              >
                <Text style={styles.confirmButtonText}>
                  {isLoading ? 'Habilitando...' : 'Habilitar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Botão de logout */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Text style={styles.logoutButtonText}>Sair (Logout)</Text>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    marginBottom: 30,
    textAlign: 'center',
  },
  userInfo: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textLight,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    marginBottom: 15,
    fontSize: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingInfo: {
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  notSupported: {
    paddingVertical: 15,
  },
  notSupportedText: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  passwordContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  passwordLabel: {
    fontSize: 14,
    marginBottom: 10,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  logoutContainer: {
    marginTop: 'auto',
    paddingBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
}); 