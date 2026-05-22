import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

const C = { bg: '#1a0d0a', cream: '#f6efe4', peach: '#ff9a78', muted: '#9a8270', bg3: '#3a2419', faint: '#5a4a3c' };

export default function Welcome2() {
  return (
    <View style={s.container}>
      <View style={s.topRow}>
        <Text style={s.logo}>GG</Text>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={s.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={s.body}>
        <Text style={s.art}>7 🔥</Text>
        <View style={s.pipRow}>
          {[1,1,1,0,1,1,1].map((filled, i) => (
            <View key={i} style={[s.pip, !!filled && s.pipFilled, i === 3 && s.pipSkip]} />
          ))}
        </View>
        <Text style={s.heading}>The streak matters.</Text>
        <Text style={s.desc}>
          GG every day, the streak grows.{'\n'}
          Skip a day, it resets.{'\n'}
          You get one free skip per week — life happens.
        </Text>
      </View>

      <View style={s.footer}>
        <Dots current={1} />
        <TouchableOpacity style={s.cta} onPress={() => router.replace('/onboarding/welcome-3')}>
          <Text style={s.ctaText}>Next</Text>
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
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 24, fontWeight: '900', color: C.cream },
  skip: { fontSize: 14, color: C.faint },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  art: { fontSize: 64, fontWeight: '900', color: C.cream },
  pipRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  pip: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#3a2419', borderWidth: 1, borderColor: '#2a1d18' },
  pipFilled: { backgroundColor: C.peach, borderColor: C.peach },
  pipSkip: { backgroundColor: '#3a2419', borderColor: C.peach, opacity: 0.5 },
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
