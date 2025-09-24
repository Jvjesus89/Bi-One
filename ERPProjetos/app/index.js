import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona automaticamente para a tela de login
    router.replace('/login');
  }, []);

  return null; // Não renderiza nada, apenas redireciona
} 