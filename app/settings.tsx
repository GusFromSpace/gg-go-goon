import { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView, Modal, Alert } from 'react-native';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { storage } from '@/services/storage';
import { notificationService } from '@/services/notifications';
import type { NotificationSettings } from '@/types';

const C = {
  bg:       '#1a0d0a',
  bg2:      '#251612',
  bg3:      '#3a2419',
  hairline: '#2a1d18',
  cream:    '#f6efe4',
  peach:    '#ff9a78',
  muted:    '#9a8270',
  faint:    '#5a4a3c',
};

const FREQ_OPTIONS = [
  { label: 'Every 4 hours', value: 4 },
  { label: 'Every 6 hours', value: 6 },
  { label: 'Every 8 hours', value: 8 },
  { label: 'Every 12 hours', value: 12 },
  { label: 'Once a day', value: 24 },
];

const WINDOW_OPTIONS = [
  { label: 'All day', start: 0, end: 24 },
  { label: 'Mornings (6 AM – 12 PM)', start: 6, end: 12 },
  { label: 'Afternoons (12 PM – 6 PM)', start: 12, end: 18 },
  { label: 'Evenings (6 PM – 11 PM)', start: 18, end: 23 },
];

function BottomSheet({ visible, onClose, title, children }: {
  visible: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={bs.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={bs.sheet}>
        <View style={bs.grabber} />
        <Text style={bs.sheetTitle}>{title}</Text>
        {children}
      </View>
    </Modal>
  );
}

export default function Settings() {
  const [notifSettings, setNotifSettings] = useState<NotificationSettings | null>(null);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [showFreq, setShowFreq] = useState(false);
  const [showWindow, setShowWindow] = useState(false);

  useEffect(() => {
    storage.getNotificationSettings().then(setNotifSettings);
    storage.getAppLockEnabled().then(setLockEnabled);
  }, []);

  async function updateSettings(updated: NotificationSettings) {
    setNotifSettings(updated);
    await storage.saveNotificationSettings(updated);
    await notificationService.scheduleAll(updated);
  }

  async function handleLockToggle(val: boolean) {
    if (val) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify to enable app lock',
        fallbackLabel: 'Use PIN',
      });
      if (!result.success) {
        Alert.alert('Verification failed', 'App lock not enabled.');
        return;
      }
    }
    setLockEnabled(val);
    await storage.setAppLockEnabled(val);
  }

  function getWindowLabel() {
    if (!notifSettings) return '';
    const opt = WINDOW_OPTIONS.find(o => o.start === notifSettings.windowStart && o.end === notifSettings.windowEnd);
    return opt?.label ?? 'Custom';
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
        <Row label="Enabled" last={!notifSettings.enabled}>
          <Switch value={notifSettings.enabled}
            onValueChange={v => updateSettings({ ...notifSettings, enabled: v })}
            trackColor={{ true: C.peach }} thumbColor={C.bg} />
        </Row>
        {notifSettings.enabled && (
          <>
            <TouchableRow label="Frequency" value={FREQ_OPTIONS.find(o => o.value === notifSettings.frequencyHours)?.label ?? ''}
              onPress={() => setShowFreq(true)} />
            <TouchableRow label="Active window" value={getWindowLabel()}
              onPress={() => setShowWindow(true)} last />
          </>
        )}
      </Section>

      <Section label="Privacy">
        <Row label="App Lock" last>
          <Switch value={lockEnabled} onValueChange={handleLockToggle}
            trackColor={{ true: C.peach }} thumbColor={C.bg} />
        </Row>
        <Text style={s.rowSub}>Use device biometric or PIN on launch.</Text>
      </Section>

      <Section label="Legal">
        <TouchableOpacity onPress={() => router.push('/onboarding/tos')}>
          <Text style={s.link}>Terms of Service</Text>
        </TouchableOpacity>
        <Text style={s.legal}>GG is not responsible for any injuries sustained while using this app.</Text>
      </Section>

      {/* Frequency sheet */}
      <BottomSheet visible={showFreq} onClose={() => setShowFreq(false)} title="FREQUENCY">
        {FREQ_OPTIONS.map(opt => (
          <TouchableOpacity key={opt.value} style={[bs.option,
            notifSettings.frequencyHours === opt.value && bs.optionSelected]}
            onPress={() => { updateSettings({ ...notifSettings, frequencyHours: opt.value }); setShowFreq(false); }}>
            <View style={[bs.radio, notifSettings.frequencyHours === opt.value && bs.radioSelected]}>
              {notifSettings.frequencyHours === opt.value && <Text style={bs.radioCheck}>✓</Text>}
            </View>
            <Text style={bs.optionText}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </BottomSheet>

      {/* Window sheet */}
      <BottomSheet visible={showWindow} onClose={() => setShowWindow(false)} title="ACTIVE WINDOW">
        {WINDOW_OPTIONS.map(opt => {
          const selected = notifSettings.windowStart === opt.start && notifSettings.windowEnd === opt.end;
          return (
            <TouchableOpacity key={opt.label} style={[bs.option, selected && bs.optionSelected]}
              onPress={() => { updateSettings({ ...notifSettings, windowStart: opt.start, windowEnd: opt.end }); setShowWindow(false); }}>
              <View style={[bs.radio, selected && bs.radioSelected]}>
                {selected && <Text style={bs.radioCheck}>✓</Text>}
              </View>
              <Text style={bs.optionText}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </BottomSheet>
    </ScrollView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={s.section}><Text style={s.sectionLabel}>{label}</Text>{children}</View>;
}

function Row({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <View style={[s.row, !last && s.rowBorder]}>
      <Text style={s.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

function TouchableRow({ label, value, onPress, last }: { label: string; value: string; onPress: () => void; last?: boolean }) {
  return (
    <TouchableOpacity style={[s.row, !last && s.rowBorder]} onPress={onPress}>
      <Text style={s.rowLabel}>{label}</Text>
      <View style={s.rowRight}>
        <Text style={s.rowValue}>{value}</Text>
        <Text style={s.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingTop: 56, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  back: { fontSize: 24, color: C.cream, width: 32 },
  title: { fontSize: 18, fontWeight: '700', color: C.cream },
  section: { marginBottom: 32 },
  sectionLabel: { fontSize: 10, color: C.muted, letterSpacing: 1.5, fontWeight: '600',
    textTransform: 'uppercase', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, backgroundColor: C.bg2, paddingHorizontal: 16,
    borderRadius: 0 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
  rowLabel: { fontSize: 15, color: C.cream },
  rowSub: { fontSize: 12, color: C.faint, paddingHorizontal: 16, paddingTop: 8 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValue: { fontSize: 14, color: C.muted },
  chevron: { fontSize: 18, color: C.faint },
  link: { fontSize: 15, color: C.muted, paddingVertical: 8 },
  legal: { fontSize: 12, color: C.faint, marginTop: 8, lineHeight: 18 },
});

const bs = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderTopColor: C.hairline, padding: 20, paddingBottom: 40 },
  grabber: { width: 36, height: 4, backgroundColor: C.bg3, borderRadius: 2,
    alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 10, color: C.muted, letterSpacing: 1.5, fontWeight: '600',
    marginBottom: 12 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10,
    borderRadius: 10, borderWidth: 1, borderColor: 'transparent', marginBottom: 6 },
  optionSelected: { backgroundColor: C.bg2, borderColor: C.peach },
  optionText: { fontSize: 15, color: C.cream },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5,
    borderColor: C.faint, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { backgroundColor: C.peach, borderColor: C.peach },
  radioCheck: { fontSize: 12, color: C.bg, fontWeight: '700' },
});
