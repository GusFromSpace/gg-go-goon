import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { storage } from '@/services/storage';
import { revenueCat } from '@/services/revenuecat';

SplashScreen.preventAutoHideAsync();

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

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0a0a' },
        headerTintColor: '#fff',
        contentStyle: { backgroundColor: '#0a0a0a' },
        headerShown: false,
      }}
    />
  );
}
