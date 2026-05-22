import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import * as LocalAuthentication from 'expo-local-authentication';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { storage } from '@/services/storage';

const BG = '#1a0d0a'; // warm black — matches splash + icon background

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync(BG);

type AppState = 'loading' | 'age' | 'tos' | 'onboarding' | 'locked' | 'ready';

export default function RootLayout() {
  const [appState, setAppState] = useState<AppState>('loading');
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const ageOk = await storage.isAgeVerified();
      const tosOk = await storage.isTosAccepted();
      const onboarded = await storage.isOnboarded();
      await SplashScreen.hideAsync();

      if (!ageOk) { setAppState('age'); return; }
      if (!tosOk) { setAppState('tos'); return; }
      if (!onboarded) { setAppState('onboarding'); return; }

      const lockEnabled = await storage.getAppLockEnabled();
      if (lockEnabled) {
        const auth = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock GG',
          fallbackLabel: 'Use PIN',
        });
        if (!auth.success) { setAppState('locked'); return; }
      }

      setAppState('ready');
    }
    init();
  }, []);

  useEffect(() => {
    if (appState === 'loading') return;
    if (appState === 'age') router.replace('/onboarding/age-gate');
    else if (appState === 'tos') router.replace('/onboarding/tos');
    else if (appState === 'onboarding') router.replace('/onboarding/welcome-1');
    else if (appState === 'locked') router.replace('/locked');
    else if (appState === 'ready') router.replace('/');
  }, [appState]);

  return (
    <SafeAreaProvider style={s.root}>
      <StatusBar style="light" />
      <Slot />
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
});
