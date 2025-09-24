import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRootNavigationState, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';

import { useAuth } from '@/hooks/useAuth';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const navReady = useRootNavigationState();
  const hasRoutedRef = useRef(false);
  
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    // Torna a barra de navegação do sistema transparente (efeito edge-to-edge)
    SystemUI.setBackgroundColorAsync('transparent');
  }, []);

  useEffect(() => {
    // Aguarda navegação pronta e fontes carregadas; só redireciona uma vez
    if (loading || !navReady?.key || !loaded || hasRoutedRef.current) return;

    // Evita sobrescrever se já está em uma rota válida
    const isInTabs = pathname?.startsWith('/(tabs)');
    const isAuthRoute = pathname === '/login' || pathname === '/signup';

    if (user) {
      if (!isInTabs) {
        router.replace('/(tabs)');
      }
    } else {
      if (!isAuthRoute) {
        router.replace('/login');
      }
    }

    hasRoutedRef.current = true;
  }, [user, loading, navReady?.key, loaded, pathname, router]);

  if (!loaded || loading) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="products" options={{ headerShown: true }} />
        <Stack.Screen name="stock" options={{ headerShown: true }} />
        <Stack.Screen name="sales" options={{ headerShown: true }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" hidden={true} />
    </ThemeProvider>
  );
}
