import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { storage } from '@/services/storage';
import { notificationService } from '@/services/notifications';
import type { AppStats } from '@/types';

type Phase = 'idle' | 'active' | 'done';

export default function Home() {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    storage.getStats().then(setStats);
    notificationService.requestPermissions().then(async (granted) => {
      if (granted) {
        const settings = await storage.getNotificationSettings();
        await notificationService.scheduleAll(settings);
      }
    });
  }, []);

  useEffect(() => {
    if (phase === 'active') {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      pulse.stopAnimation();
      pulse.setValue(1);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase]);

  async function handleMainPress() {
    if (phase === 'idle') {
      setPhase('active');
      setElapsed(0);
    } else if (phase === 'active') {
      setPhase('done');
      const updated = await storage.recordSession(elapsed);
      setStats(updated);
    } else {
      setPhase('idle');
      setElapsed(0);
    }
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  const buttonLabel =
    phase === 'idle' ? 'GO' :
    phase === 'active' ? 'DONE' :
    'GG';

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.logo}>GG</Text>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Text style={s.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      {stats && (
        <View style={s.statsRow}>
          <Stat label="Streak" value={`${stats.streak}🔥`} />
          <Stat label="This Week" value={String(stats.weeklyCount)} />
          <Stat label="All Time" value={String(stats.totalSessions)} />
        </View>
      )}

      <View style={s.mainArea}>
        {phase === 'active' && (
          <Text style={s.timer}>{formatTime(elapsed)}</Text>
        )}
        {phase === 'done' && (
          <Text style={s.doneText}>GG. Good game.</Text>
        )}

        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <TouchableOpacity
            style={[s.mainBtn, phase === 'active' && s.mainBtnActive, phase === 'done' && s.mainBtnDone]}
            onPress={handleMainPress}
            activeOpacity={0.85}
          >
            <Text style={s.mainBtnText}>{buttonLabel}</Text>
          </TouchableOpacity>
        </Animated.View>

        {phase === 'idle' && (
          <Text style={s.hint}>tap when ready</Text>
        )}
        {phase === 'active' && (
          <Text style={s.hint}>tap when done</Text>
        )}
      </View>

      <TouchableOpacity style={s.statsBtn} onPress={() => router.push('/stats')}>
        <Text style={s.statsBtnText}>View History</Text>
      </TouchableOpacity>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  settingsIcon: { fontSize: 22, color: '#555' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 48 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 12, color: '#555', marginTop: 2 },
  mainArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  timer: { fontSize: 48, fontWeight: '200', color: '#fff', letterSpacing: 4 },
  doneText: { fontSize: 20, color: '#888', fontWeight: '300' },
  mainBtn: { width: 180, height: 180, borderRadius: 90, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  mainBtnActive: { backgroundColor: '#e0e0e0' },
  mainBtnDone: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333' },
  mainBtnText: { fontSize: 36, fontWeight: '900', color: '#0a0a0a', letterSpacing: -1 },
  hint: { fontSize: 13, color: '#444' },
  statsBtn: { paddingVertical: 16, alignItems: 'center' },
  statsBtnText: { fontSize: 14, color: '#444' },
});
