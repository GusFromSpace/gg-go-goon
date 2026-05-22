import { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { router } from 'expo-router';
import { storage } from '@/services/storage';
import { notificationService } from '@/services/notifications';
import type { NotificationSettings } from '@/types';

const SUPPORT_URL = 'https://buymeacoffee.com/gusfromspace';

const FREQUENCY_OPTIONS = [
  { label: 'Every 4 hours', value: 4 },
  { label: 'Every 8 hours', value: 8 },
  { label: 'Twice a day', value: 12 },
  { label: 'Once a day', value: 24 },
];

export default function Settings() {
  const [notifSettings, setNotifSettings] = useState<NotificationSettings | null>(null);

  useEffect(() => {
    storage.getNotificationSettings().then(setNotifSettings);
  }, []);

  async function updateSettings(updated: NotificationSettings) {
    setNotifSettings(updated);
    await storage.saveNotificationSettings(updated);
    await notificationService.scheduleAll(updated);
  }

  if (!notifSettings) return null;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <Section label="Notifications">
        <Row label="Enabled">
          <Switch
            value={notifSettings.enabled}
            onValueChange={(v) => updateSettings({ ...notifSettings, enabled: v })}
            trackColor={{ true: '#fff' }}
            thumbColor="#0a0a0a"
          />
        </Row>

        {notifSettings.enabled && (
          <>
            <Text style={s.subLabel}>Frequency</Text>
            {FREQUENCY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={s.optionRow}
                onPress={() => updateSettings({ ...notifSettings, frequencyHours: opt.value })}
              >
                <Text style={s.optionLabel}>{opt.label}</Text>
                {notifSettings.frequencyHours === opt.value && (
                  <Text style={s.check}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}
      </Section>

      <Section label="Support the Dev">
        <Text style={s.supportDesc}>
          GG is free. If it's brought value to your life — you know what kind — consider buying the dev a coffee.
        </Text>
        <TouchableOpacity
          style={s.supportBtn}
          onPress={() => Linking.openURL(SUPPORT_URL)}
        >
          <Text style={s.supportBtnText}>☕ Buy Me a Coffee</Text>
        </TouchableOpacity>
      </Section>

      <Section label="Legal">
        <TouchableOpacity onPress={() => router.push('/onboarding/tos')}>
          <Text style={s.link}>Terms of Service</Text>
        </TouchableOpacity>
        <Text style={s.legal}>
          GG is not responsible for any injuries sustained while using this app.
        </Text>
      </Section>
    </ScrollView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  back: { fontSize: 24, color: '#fff', width: 32 },
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },
  section: { marginBottom: 40 },
  sectionLabel: { fontSize: 12, color: '#555', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  rowLabel: { fontSize: 16, color: '#fff' },
  subLabel: { fontSize: 13, color: '#555', marginTop: 16, marginBottom: 8 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  optionLabel: { fontSize: 15, color: '#ccc' },
  check: { fontSize: 15, color: '#fff' },
  supportDesc: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 20 },
  supportBtn: { borderWidth: 1, borderColor: '#fff', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  supportBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  link: { fontSize: 15, color: '#888', paddingVertical: 8 },
  legal: { fontSize: 12, color: '#333', marginTop: 16, lineHeight: 18 },
});
