import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { storage } from '@/services/storage';
import { revenueCat } from '@/services/revenuecat';

const BG = '#0a0a0a';

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync(BG);

type AppState = 'loading' | 'onboarding-age' | 'onboarding-tos' | 'ready';

export default function RootLayout() {
  const [appState, setAppState] = useState<AppState>('loading');
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    async function init() {
      try { await revenueCat.init(); } catch {}

      const ageOk = await storage.isAgeVerified();
      const tosOk = await storage.isTosAccepted();

      await SplashScreen.hideAsync();

      if (!ageOk) {
        setAppState('onboarding-age');
      } else if (!tosOk) {
        setAppState('onboarding-tos');
      } else {
        setAppState('ready');
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (appState === 'loading') return;
    if (appState === 'onboarding-age') {
      router.replace('/onboarding/age-gate');
    } else if (appState === 'onboarding-tos') {
      router.replace('/onboarding/tos');
    } else if (appState === 'ready') {
      router.replace('/');
    }
  }, [appState]);

  return (
    <SafeAreaProvider style={s.root}>
      <StatusBar style="light" />
      <Slot />
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
});
