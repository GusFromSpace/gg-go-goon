import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { storage } from '@/services/storage';
import type { AppStats, HeatmapCell } from '@/types';

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

const HEAT_COLORS = ['#2a1d18', '#5a3a2a', '#a85a3a', '#ff9a78'];
const DAYS_SHORT = ['Mo','Tu','We','Th','Fr','Sa','Su'];

function formatSec(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function Stats() {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapCell[][]>([]);
  const [dayDist, setDayDist] = useState<number[]>([]);
  const [peakHour, setPeakHour] = useState<number | null>(null);
  const [avgSec, setAvgSec] = useState(0);

  useEffect(() => {
    async function load() {
      const [s, h, d, p, a] = await Promise.all([
        storage.getStats(),
        storage.getHeatmap(18),
        storage.getDayOfWeekDistribution(),
        storage.getPeakHour(),
        storage.getAverageSessionSec(),
      ]);
      setStats(s);
      setHeatmap(h);
      setDayDist(d);
      setPeakHour(p);
      setAvgSec(a);
    }
    load();
  }, []);

  function formatPeakHour(h: number | null) {
    if (h === null) return '—';
    const start = h % 12 || 12;
    const end = (h + 2) % 12 || 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    return `${start} – ${end} ${ampm}`;
  }

  const isEmpty = !stats || stats.totalSessions === 0;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>History</Text>
        <View style={{ width: 32 }} />
      </View>

      {isEmpty ? (
        <View style={s.emptyState}>
          <Text style={s.emptyIcon}>📊</Text>
          <Text style={s.emptyTitle}>No history yet</Text>
          <Text style={s.emptyBody}>
            Tap GO on the home screen to start. Your streak, heatmap, and records show up here once there's data.
          </Text>
        </View>
      ) : (
        <>
          {/* Top row */}
          <View style={s.topRow}>
            <View style={[s.card, { flex: 1, marginRight: 8 }]}>
              <Text style={s.cardLabel}>CURRENT STREAK</Text>
              <Text style={s.bigNum}>{stats?.streak ?? 0}</Text>
              <Text style={s.cardUnit}>days 🔥</Text>
            </View>
            <View style={[s.card, { flex: 1 }]}>
              <Text style={s.cardLabel}>LAST SESSION</Text>
              <Text style={s.bigNum} numberOfLines={1}>
                {stats?.lastSessionAt ? new Date(stats.lastSessionAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—'}
              </Text>
            </View>
          </View>

          {/* Heatmap */}
          <View style={s.card}>
            <Text style={s.cardLabel}>LAST 18 WEEKS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={s.heatmapWrap}>
                {heatmap.map((col, ci) => (
                  <View key={ci} style={s.heatCol}>
                    {col.map((cell, ri) => (
                      <View key={ri} style={[s.heatCell, { backgroundColor: HEAT_COLORS[cell.intensity] }]} />
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
            <View style={s.heatLegend}>
              <Text style={s.legendLabel}>less</Text>
              {HEAT_COLORS.map((c, i) => (
                <View key={i} style={[s.legendCell, { backgroundColor: c }]} />
              ))}
              <Text style={s.legendLabel}>more</Text>
            </View>
          </View>

          {/* Records */}
          <View style={s.twoCol}>
            <RecordCard label="BEST STREAK" value={`${stats?.bestStreak ?? 0}`} unit="days" />
            <RecordCard label="LONGEST SESSION" value={formatSec(stats?.longestSessionSec ?? 0)} unit="" />
            <RecordCard label="AVG PER WEEK" value={(((stats?.totalSessions ?? 0) / 18) || 0).toFixed(1)} unit="sessions" />
            <RecordCard label="TOTAL TRACKED" value={formatSec(stats?.totalSecTracked ?? 0)} unit="" />
          </View>

          {/* Patterns */}
          <View style={s.card}>
            <Text style={s.cardLabel}>PATTERNS</Text>
            <View style={s.barChart}>
              {dayDist.map((count, i) => {
                const maxVal = Math.max(...dayDist, 1);
                const isPeak = count === Math.max(...dayDist) && count > 0;
                return (
                  <View key={i} style={s.barWrap}>
                    <View style={[s.bar, { height: Math.max(4, (count / maxVal) * 80),
                      backgroundColor: isPeak ? C.peach : C.bg3 }]} />
                    <Text style={s.barLabel}>{DAYS_SHORT[i]}</Text>
                  </View>
                );
              })}
            </View>
            <View style={s.patternRow}>
              <Text style={s.patternKey}>Peak time</Text>
              <Text style={s.patternVal}>{formatPeakHour(peakHour)}</Text>
            </View>
            <View style={s.patternRow}>
              <Text style={s.patternKey}>Avg session</Text>
              <Text style={[s.patternVal, { fontVariant: ['tabular-nums'] }]}>{formatSec(avgSec)}</Text>
            </View>
          </View>
        </>
      )}

      <Text style={s.footer}>🔒 All data stays on this device. Nothing is sent anywhere.</Text>
    </ScrollView>
  );
}

function RecordCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={[s.card, s.recordCard]}>
      <Text style={s.cardLabel}>{label}</Text>
      <Text style={s.recordVal}>{value}</Text>
      {unit ? <Text style={s.cardUnit}>{unit}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingTop: 56, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  back: { fontSize: 24, color: C.cream, width: 32 },
  title: { fontSize: 18, fontWeight: '700', color: C.cream },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.cream },
  emptyBody: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22, maxWidth: 280 },

  topRow: { flexDirection: 'row', marginBottom: 12 },
  card: { backgroundColor: C.bg2, borderRadius: 16, borderWidth: 1, borderColor: C.hairline, padding: 16, marginBottom: 12 },
  cardLabel: { fontSize: 10, color: C.muted, letterSpacing: 1.5, fontWeight: '600', marginBottom: 8 },
  cardUnit: { fontSize: 13, color: C.muted },
  bigNum: { fontSize: 36, fontWeight: '800', color: C.cream },

  heatmapWrap: { flexDirection: 'row', gap: 3, paddingVertical: 8 },
  heatCol: { gap: 3 },
  heatCell: { width: 10, height: 10, borderRadius: 2 },
  heatLegend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  legendLabel: { fontSize: 10, color: C.faint },
  legendCell: { width: 10, height: 10, borderRadius: 2 },

  twoCol: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  recordCard: { width: '47%', marginBottom: 0 },
  recordVal: { fontSize: 28, fontWeight: '800', color: C.cream, marginBottom: 2 },

  barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100, marginBottom: 16 },
  barWrap: { alignItems: 'center', gap: 4, flex: 1 },
  bar: { width: '60%', borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 10, color: C.faint },

  patternRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: C.hairline },
  patternKey: { fontSize: 14, color: C.muted },
  patternVal: { fontSize: 14, color: C.cream, fontWeight: '600' },

  footer: { textAlign: 'center', fontSize: 12, color: C.faint, marginTop: 12 },
});
