import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { storage } from '@/services/storage';

export default function AgeGate() {
  async function confirm() {
    await storage.setAgeVerified();
    router.replace('/onboarding/tos');
  }

  return (
    <View style={s.container}>
      <Text style={s.logo}>GG</Text>
      <Text style={s.heading}>Adults Only</Text>
      <Text style={s.body}>
        This app is intended for adults 18 and older.{'\n'}
        By continuing you confirm you are 18+.
      </Text>
      <TouchableOpacity style={s.btn} onPress={confirm}>
        <Text style={s.btnText}>I am 18 or older</Text>
      </TouchableOpacity>
      <Text style={s.exit}>Under 18? Close the app.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center', padding: 32 },
  logo: { fontSize: 64, fontWeight: '900', color: '#fff', letterSpacing: -2, marginBottom: 24 },
  heading: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 12 },
  body: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  btn: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 48, marginBottom: 16 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
  exit: { fontSize: 13, color: '#444' },
});
