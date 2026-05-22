import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { storage } from '@/services/storage';
import type { AppStats } from '@/types';

export default function Stats() {
  const [stats, setStats] = useState<AppStats | null>(null);

  useEffect(() => {
    storage.getStats().then(setStats);
  }, []);

  if (!stats) return null;

  const lastSession = stats.lastSessionAt
    ? new Date(stats.lastSessionAt).toLocaleDateString()
    : 'Never';

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>History</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={s.grid}>
        <BigStat label="Current Streak" value={`${stats.streak}`} unit="days 🔥" />
        <BigStat label="This Week" value={`${stats.weeklyCount}`} unit="sessions" />
        <BigStat label="All Time" value={`${stats.totalSessions}`} unit="total" />
        <BigStat label="Last Session" value={lastSession} unit="" />
      </View>

      <Text style={s.note}>
        All data is stored locally on your device.{'\n'}Nothing leaves your phone.
      </Text>
    </View>
  );
}

function BigStat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
      {unit ? <Text style={s.statUnit}>{unit}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  back: { fontSize: 24, color: '#fff', width: 32 },
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },
  grid: { gap: 16 },
  statCard: { backgroundColor: '#111', borderRadius: 12, padding: 24 },
  statLabel: { fontSize: 12, color: '#555', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  statValue: { fontSize: 36, fontWeight: '700', color: '#fff' },
  statUnit: { fontSize: 14, color: '#555', marginTop: 4 },
  note: { position: 'absolute', bottom: 40, left: 24, right: 24, fontSize: 12, color: '#333', textAlign: 'center', lineHeight: 18 },
});
