import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { storage } from '@/services/storage';
import { revenueCat } from '@/services/revenuecat';

const BG = '#0a0a0a';

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync(BG);

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      await revenueCat.init();
      const ageOk = await storage.isAgeVerified();
      const tosOk = await storage.isTosAccepted();
      await SplashScreen.hideAsync();
      setReady(true);

      if (!ageOk) {
        router.replace('/onboarding/age-gate');
      } else if (!tosOk) {
        router.replace('/onboarding/tos');
      }
    }
    init();
  }, []);

  if (!ready) return (
    <View style={s.root} />
  );

  return (
    <SafeAreaProvider style={s.root}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: BG },
          headerTintColor: '#fff',
          contentStyle: { backgroundColor: BG },
          headerShown: false,
          animation: 'fade',
        }}
      />
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
});
