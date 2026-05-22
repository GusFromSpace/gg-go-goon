import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { storage } from '@/services/storage';

export default function Tos() {
  async function accept() {
    await storage.setTosAccepted();
    router.replace('/');
  }

  return (
    <View style={s.container}>
      <Text style={s.logo}>GG</Text>
      <Text style={s.heading}>Terms of Service</Text>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        <Text style={s.body}>
          GG ("the App") is an entertainment and wellness reminder application
          intended for adults 18 and older.{'\n\n'}

          BY USING THIS APP YOU AGREE:{'\n\n'}

          1. You are 18 years of age or older.{'\n\n'}

          2. You are solely responsible for all decisions made while using this
          app. The developer is not responsible for any injuries, physical
          strain, repetitive stress, time management failures, relationship
          consequences, or any other outcomes sustained while using or as a
          result of using this app.{'\n\n'}

          3. This app provides general wellness information for entertainment
          purposes only. Nothing in this app constitutes medical advice.{'\n\n'}

          4. The "Commitment Tier" is a recurring subscription. You receive no
          additional features or content in exchange for payment. The
          transaction itself is the feature.{'\n\n'}

          5. We collect no personally identifiable information. Usage data is
          anonymous and stored on your device only.{'\n\n'}

          6. This app is not affiliated with, endorsed by, or responsible for
          any content you may seek out as a result of using it.{'\n\n'}

          TLDR: You're an adult. You downloaded this on purpose. We're not
          responsible for anything. Have fun. Be safe.
        </Text>
      </ScrollView>
      <TouchableOpacity style={s.btn} onPress={accept}>
        <Text style={s.btnText}>I Accept. Let's Go.</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', padding: 32, paddingTop: 80 },
  logo: { fontSize: 48, fontWeight: '900', color: '#fff', letterSpacing: -2, marginBottom: 12 },
  heading: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 16 },
  scroll: { flex: 1, width: '100%' },
  scrollContent: { paddingBottom: 24 },
  body: { fontSize: 14, color: '#888', lineHeight: 22 },
  btn: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 48, marginTop: 16, width: '100%', alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
});
