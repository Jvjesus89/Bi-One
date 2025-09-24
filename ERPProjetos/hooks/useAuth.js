import { supabase } from '@/lib/supabase';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';

// Função para delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCompany, setActiveCompany] = useState(null); // Estado para a empresa ativa

  // Busca o perfil do utilizador (tabela 'usuarios')
  async function fetchProfile(userEmail) {
    try {
      const { data, error } = await supabase.from('usuarios').select('*').eq('email', userEmail).single();
      if (!error && data) setProfile(data);
      else setProfile(null);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      setProfile(null);
    }
  }

  // Busca a empresa do utilizador e define-a como ativa
  async function fetchCompanyInfo(userId) {
    try {
        const { data: membership, error } = await supabase
            .from('membros_empresa')
            .select('empresa_id, empresas(id, nome)')
            .eq('user_id', userId)
            .single(); // Assumimos 1 empresa por utilizador por enquanto

        if (error) throw error;

        if (membership) {
            const company = { id: membership.empresa_id, nome: membership.empresas.nome };
            setActiveCompany(company);
        } else {
            setActiveCompany(null);
        }
    } catch (error) {
        console.error("Erro ao buscar empresa do utilizador:", error);
        setActiveCompany(null);
    }
  }

  // Funções de autenticação biométrica
  const isBiometricSupport = async () => {
    try {
      return await LocalAuthentication.hasHardwareAsync();
    } catch {
      return false;
    }
  };

  const enableBiometrics = async (email, password) => {
    try {
      await SecureStore.setItemAsync('biometric_email', email);
      await SecureStore.setItemAsync('biometric_password', password);
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  };
  const disableBiometrics = async () => { /* ... */ };
  const getBiometricCredentials = async () => {
    try {
      return await LocalAuthentication.isEnrolledAsync();
    } catch {
      return false;
    }
  };

const getSavedCredentials = async () => {
  try {
    const email = await SecureStore.getItemAsync('biometric_email');
    const password = await SecureStore.getItemAsync('biometric_password');
    if (email && password) return { email, password };
    return null;
  } catch {
    return null;
  }
};

const loginWithBiometrics = async () => {
  try {
    const biometricResult = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Entrar com biometria',
      fallbackLabel: 'Usar senha',
    });
    if (!biometricResult.success) return false;

    const credentials = await getSavedCredentials();
    if (!credentials?.email || !credentials?.password) return false;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    return !!data?.user;
  } catch {
    return false;
  }
};
  // Efeito que gere a sessão do utilizador
  useEffect(() => {
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
            await Promise.all([
                fetchProfile(session.user.email),
                fetchCompanyInfo(session.user.id)
            ]);
        }
        setLoading(false);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await Promise.all([
            fetchProfile(session.user.email),
            fetchCompanyInfo(session.user.id)
        ]);
      } else {
        setProfile(null);
        setActiveCompany(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      if (data.user) {
        // Após o login, busca o perfil E a empresa em paralelo
        await Promise.all([
            fetchProfile(data.user.email),
            fetchCompanyInfo(data.user.id)
        ]);
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signUp = async (email, password, usuario) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailConfirm: true // Recomenda-se manter a confirmação por email
        }
      });
      if (error) throw error;
      
      if (data.user) {
        await delay(2000);
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // O onAuthStateChange irá limpar o user, profile e activeCompany
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  return {
    user,
    profile,
    loading,
    activeCompany, // Expondo a empresa ativa
    signIn,
    signUp,
    signOut,
    isBiometricSupport,
    enableBiometrics,
    disableBiometrics,
    getBiometricCredentials,
    loginWithBiometrics,
  };
}
