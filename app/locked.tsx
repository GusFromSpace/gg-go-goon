import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';

const C = { bg: '#1a0d0a', cream: '#f6efe4', peach: '#ff9a78', muted: '#9a8270' };

export default function Locked() {
  async function unlock() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock GG',
      fallbackLabel: 'Use PIN',
    });
    if (result.success) router.replace('/');
  }

  return (
    <View style={s.container}>
      <Image source={require('../assets/icon.png')} style={s.logo} />
      <Text style={s.icon}>🔒</Text>
      <Text style={s.label}>Locked</Text>
      <TouchableOpacity style={s.btn} onPress={unlock}>
        <Text style={s.btnText}>Unlock</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 16 },
  logo: { width: 140, height: 140, borderRadius: 32 },
  icon: { fontSize: 48, marginTop: 8 },
  label: { fontSize: 18, color: C.muted },
  btn: { marginTop: 16, borderWidth: 1, borderColor: C.peach, borderRadius: 12,
    paddingHorizontal: 40, paddingVertical: 14 },
  btnText: { fontSize: 15, fontWeight: '700', color: C.peach },
});
