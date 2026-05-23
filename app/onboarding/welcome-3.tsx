import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { storage } from '@/services/storage';

const C = { bg: '#1a0d0a', cream: '#f6efe4', peach: '#ff9a78', muted: '#9a8270', bg3: '#3a2419' };

export default function Welcome3() {
  async function finish() {
    await storage.setOnboarded();
    router.replace('/');
  }

  return (
    <View style={s.container}>
      <View style={s.topRow}>
        <Image source={require('../../assets/icon.png')} style={s.logo} />
      </View>

      <View style={s.body}>
        <View style={s.lockCircle}>
          <Text style={s.lockIcon}>🔒</Text>
        </View>
        <Text style={s.heading}>All yours.</Text>
        <Text style={s.desc}>
          No accounts. No servers. No tracking.{'\n'}
          Everything stays on this phone.{'\n'}
          We don't even know you're here.
        </Text>
      </View>

      <View style={s.footer}>
        <Dots current={2} />
        <TouchableOpacity style={s.cta} onPress={finish}>
          <Text style={s.ctaText}>Let's go →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Dots({ current }: { current: number }) {
  return (
    <View style={s.dots}>
      {[0, 1, 2].map(i => (
        <View key={i} style={[s.dot, i === current && s.dotActive]} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 24, paddingTop: 60 },
  topRow: { marginBottom: 40 },
  logo: { width: 44, height: 44, borderRadius: 10 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  lockCircle: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: C.peach,
    alignItems: 'center', justifyContent: 'center' },
  lockIcon: { fontSize: 40 },
  heading: { fontSize: 32, fontWeight: '900', color: C.cream, textAlign: 'center' },
  desc: { fontSize: 15, color: C.muted, textAlign: 'center', lineHeight: 24, maxWidth: 280 },
  footer: { gap: 20, paddingBottom: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.bg3 },
  dotActive: { width: 20, height: 6, borderRadius: 3, backgroundColor: C.peach },
  cta: { backgroundColor: C.cream, borderRadius: 14, paddingVertical: 18, alignItems: 'center',
    shadowColor: C.peach, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  ctaText: { fontSize: 16, fontWeight: '700', color: C.bg },
});
