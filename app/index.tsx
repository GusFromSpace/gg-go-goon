import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { storage } from '@/services/storage';
import { notificationService } from '@/services/notifications';
import { RECIPE_SUGGESTIONS } from '@/content/summons';
import type { AppStats } from '@/types';

const C = {
  bg:        '#1a0d0a',
  bg2:       '#251612',
  bg3:       '#3a2419',
  hairline:  '#2a1d18',
  cream:     '#f6efe4',
  peach:     '#ff9a78',
  peachDeep: '#e86a4a',
  muted:     '#9a8270',
  faint:     '#5a4a3c',
};

type Phase = 'idle' | 'active' | 'done';

const DAYS = ['M','T','W','T','F','S','S'];
const H = 3600000;

const QUICK_FINISH = [
  'some people find it flattering...',
  'that\'s it?',
  '...ok',
  'new record.',
  'efficiency mode unlocked.',
  'bold of you to share that.',
  'blink and you\'d miss it.',
  'we won\'t tell anyone.',
  'some call it a gift.',
  'quality over quantity, allegedly.',
];

const LONG_RUN = [
  'ok we\'re genuinely impressed.',
  'you ok in there?',
  'the dedication is noted.',
  'marathon mode: achieved.',
  'committed. truly.',
  'someone get this person some water.',
  'historians will write about this.',
  'we weren\'t worried. we were a little worried.',
];

// Fireworks particle
function Particle({ angle, radius, delay }: { angle: number; radius: number; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 700 + Math.random() * 350,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  return (
    <Animated.View style={{
      position: 'absolute',
      width: 6, height: 6,
      borderRadius: 3,
      backgroundColor: Math.random() > 0.5 ? C.peach : C.cream,
      opacity: anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 0] }),
      transform: [
        { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, x] }) },
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, y] }) },
      ],
    }} />
  );
}

function FireworksBurst() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    angle: (i / 18) * Math.PI * 2,
    radius: 60 + Math.random() * 70,
    delay: Math.random() * 100,
  }));
  return (
    <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
      {particles.map((p, i) => <Particle key={i} {...p} />)}
    </View>
  );
}

export default function Home() {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [showFireworks, setShowFireworks] = useState(false);
  const [recipe, setRecipe] = useState<string | null>(null);
  const [graceDismissed, setGraceDismissed] = useState(false);
  const [eggMsg, setEggMsg] = useState<string | null>(null);
  const [isMarathon, setIsMarathon] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const blush = useRef(new Animated.Value(0)).current;

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
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])).start();
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      pulse.stopAnimation();
      pulse.setValue(1);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase]);

  async function handleGo() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPhase('active');
    setElapsed(0);
  }

  function triggerBlush(intensity: number, duration: number) {
    blush.setValue(0);
    Animated.sequence([
      Animated.timing(blush, { toValue: intensity, duration: 600, useNativeDriver: true }),
      Animated.timing(blush, { toValue: intensity * 0.7, duration: 200, useNativeDriver: true }),
      Animated.timing(blush, { toValue: intensity, duration: 300, useNativeDriver: true }),
      Animated.timing(blush, { toValue: 0, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }

  async function handleDone() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase('done');

    const quick = elapsed < 10;
    const marathon = elapsed >= 3600;

    setIsMarathon(marathon);

    if (quick) {
      setEggMsg(QUICK_FINISH[Math.floor(Math.random() * QUICK_FINISH.length)]);
      triggerBlush(0.18, 2800); // embarrassed flush
    } else if (marathon) {
      setEggMsg(LONG_RUN[Math.floor(Math.random() * LONG_RUN.length)]);
      triggerBlush(0.22, 4000); // hot and sweaty
    }

    setShowFireworks(!quick); // no confetti for the speed run, that would be insulting
    if (Math.random() < 0.25 && !quick) {
      setRecipe(RECIPE_SUGGESTIONS[Math.floor(Math.random() * RECIPE_SUGGESTIONS.length)]);
    }
    if (!quick) {
      // sub-10s doesn't count — easter egg fires but nothing is recorded
      const updated = await storage.recordSession(elapsed);
      setStats(updated);
      setTimeout(() => setShowFireworks(false), 1500);
    }
  }

  async function handleReset() {
    await Haptics.selectionAsync();
    setPhase('idle');
    setElapsed(0);
    setRecipe(null);
    setEggMsg(null);
    setIsMarathon(false);
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  function formatSince(ts: number | null) {
    if (!ts) return null;
    const diff = Date.now() - ts;
    if (diff < H) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 24 * H) return `${Math.floor(diff / H)}h ago`;
    return `${Math.floor(diff / (24 * H))}d ago`;
  }

  function sinceColor(ts: number | null) {
    if (!ts) return C.muted;
    const diff = Date.now() - ts;
    if (diff < 4 * H) return C.muted;
    if (diff < 24 * H) return C.peach;
    return '#ff5a8a';
  }

  // 7-day pip strip with per-day session counts
  function getPips() {
    if (!stats) return [];
    const today = new Date(); today.setHours(0,0,0,0);
    const pips = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0,10);
      const isToday = i === 0;
      const count = stats.sessions?.filter(s =>
        new Date(s.startedAt).toISOString().slice(0,10) === dateStr
      ).length ?? 0;
      const isGrace = stats.weeklySkipUsedAt &&
        new Date(stats.weeklySkipUsedAt).toISOString().slice(0,10) === dateStr;
      pips.push({ dateStr, isToday, count, isGrace });
    }
    return pips;
  }

  const pips = getPips();
  const todayCount = pips.find(p => p.isToday)?.count ?? 0;
  const isFirstSession = !stats || stats.totalSessions === 0;
  const showGraceBanner = !graceDismissed && stats?.weeklySkipUsedAt &&
    Date.now() - stats.weeklySkipUsedAt < 24 * H;

  return (
    <View style={s.container}>
      {/* Blush overlay — embarrassment or exertion */}
      <Animated.View
        pointerEvents="none"
        style={[s.blushOverlay, { opacity: blush }]}
      />
      {/* Grace banner */}
      {showGraceBanner && (
        <View style={s.graceBanner}>
          <Text style={s.graceText}>🛟 Streak saved · You used your skip for the week. 1/1 used.</Text>
          <TouchableOpacity onPress={() => setGraceDismissed(true)}>
            <Text style={s.graceClose}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Header */}
      <View style={s.header}>
        <Text style={s.logo}>GG</Text>
        {phase === 'active' ? (
          <View style={s.activePill}>
            <Text style={s.activePillText}>● ACTIVE</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Text style={s.gear}>⚙</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Streak card or empty state */}
      {phase === 'idle' && (
        <View style={[s.card, isFirstSession && s.cardDashed]}>
          {isFirstSession ? (
            <>
              <Text style={s.cardTitle}>Your first session awaits.</Text>
              <View style={s.pipRow}>
                {DAYS.map((d, i) => (
                  <View key={i} style={s.pipWrap}>
                    <View style={[s.pip, s.pipEmpty, s.pipDash]} />
                    <Text style={s.pipLabel}>{d}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <>
              <View style={s.cardTopRow}>
                <Text style={s.cardLabel}>CURRENT STREAK</Text>
                {stats?.lastSessionAt && (
                  <Text style={[s.sinceChip, { color: sinceColor(stats.lastSessionAt) }]}>
                    {formatSince(stats.lastSessionAt)}
                  </Text>
                )}
              </View>
              <View style={s.streakRow}>
                <Text style={s.streakNum}>{stats?.streak ?? 0}</Text>
                <Text style={s.streakUnit}> days 🔥</Text>
              </View>
              <View style={s.pipRow}>
                {pips.map((pip, i) => (
                  <View key={i} style={s.pipWrap}>
                    <View style={[
                      s.pip,
                      pip.count === 1 && s.pipOne,
                      pip.count >= 2 && pip.count <= 3 && s.pipFilled,
                      pip.count >= 4 && s.pipMax,
                      pip.isToday && s.pipToday,
                      !!pip.isGrace && s.pipGrace,
                    ]} />
                    {pip.count >= 2 && (
                      <Text style={s.pipCount}>{pip.count}</Text>
                    )}
                    {pip.count < 2 && <Text style={s.pipLabel}>{DAYS[i]}</Text>}
                  </View>
                ))}
              </View>
              {todayCount > 0 && (
                <View style={s.todayRow}>
                  <Text style={s.todayCount}>{todayCount}×</Text>
                  <Text style={s.todayLabel}> today</Text>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* Stats line */}
      {phase === 'idle' && !isFirstSession && (
        <TouchableOpacity style={s.statsLine} onPress={() => router.push('/stats')}>
          <Text style={s.statsLineText}>
            {stats?.weeklyCount ?? 0} this week · {stats?.totalSessions ?? 0} all time · view all →
          </Text>
        </TouchableOpacity>
      )}

      {/* Main area */}
      <View style={s.mainArea}>
        {phase === 'active' && (
          <Text style={s.timer}>{formatTime(elapsed)}</Text>
        )}

        {phase === 'done' && (
          <View style={s.doneArea}>
            {showFireworks && <FireworksBurst />}
            <Text style={s.doneText}>GG.</Text>
            {isMarathon && <Text style={s.marathonBadge}>💦 😳 💦</Text>}
            <Text style={s.doneSubtitle}>Good game. Streak: {stats?.streak ?? 1} days 🔥</Text>
            {todayCount > 1 && (
              <Text style={s.doneTodayCount}>that's {todayCount}× today 🔥</Text>
            )}
            {eggMsg && (
              <Text style={s.eggMsg}>{eggMsg}</Text>
            )}
            {recipe && (
              <View style={s.recipeCard}>
                <Text style={s.recipeLabel}>COOKING TIP</Text>
                <Text style={s.recipeText}>{recipe}</Text>
              </View>
            )}
          </View>
        )}

        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          {phase === 'idle' && (
            <TouchableOpacity style={s.goBtn} onPress={handleGo} activeOpacity={0.85}>
              <Text style={s.goBtnText}>GO</Text>
            </TouchableOpacity>
          )}
          {phase === 'active' && (
            <TouchableOpacity style={s.doneBtn} onPress={handleDone} activeOpacity={0.85}>
              <Text style={s.doneBtnText}>DONE</Text>
            </TouchableOpacity>
          )}
          {phase === 'done' && (
            <TouchableOpacity style={s.resetBtn} onPress={handleReset} activeOpacity={0.85}>
              <Text style={s.resetBtnText}>GG</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <Text style={s.hint}>
          {phase === 'idle' ? (isFirstSession ? 'tap to begin' : 'tap when ready') :
           phase === 'active' ? 'tap when done' : ''}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 20, paddingTop: 56 },

  graceBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,154,120,0.12)', borderWidth: 1, borderColor: 'rgba(255,154,120,0.4)',
    borderRadius: 10, padding: 12, marginBottom: 8 },
  graceText: { flex: 1, fontSize: 13, color: C.peach, lineHeight: 18 },
  graceClose: { fontSize: 20, color: C.muted, paddingLeft: 12 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logo: { fontSize: 28, fontWeight: '900', color: C.cream, letterSpacing: -1 },
  gear: { fontSize: 20, color: C.faint },
  activePill: { backgroundColor: C.bg2, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: C.peach },
  activePillText: { fontSize: 12, fontWeight: '700', color: C.peach, letterSpacing: 1 },

  card: { backgroundColor: C.bg2, borderRadius: 18, borderWidth: 1, borderColor: C.hairline,
    padding: 20, marginBottom: 12 },
  cardDashed: { borderStyle: 'dashed', borderColor: C.bg3 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardLabel: { fontSize: 11, color: C.muted, letterSpacing: 1.5, fontWeight: '600' },
  cardTitle: { fontSize: 16, color: C.cream, fontWeight: '600', marginBottom: 16 },
  sinceChip: { fontSize: 12, fontWeight: '600' },
  streakRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  streakNum: { fontSize: 72, fontWeight: '900', color: C.cream, lineHeight: 76 },
  streakUnit: { fontSize: 20, color: C.peach, fontWeight: '700' },

  pipRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pipWrap: { alignItems: 'center', gap: 4 },
  pip: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.bg3, borderWidth: 1, borderColor: C.hairline },
  pipOne:    { backgroundColor: 'rgba(255,154,120,0.45)', borderColor: C.peach },
  pipFilled: { backgroundColor: C.peach, borderColor: C.peach },
  pipMax:    { backgroundColor: C.peachDeep, borderColor: C.peachDeep,
               shadowColor: C.peachDeep, shadowOffset: { width: 0, height: 0 },
               shadowOpacity: 0.8, shadowRadius: 6, elevation: 4 },
  pipToday: { borderColor: C.cream, borderWidth: 2 },
  pipGrace: { backgroundColor: C.bg3, borderColor: C.peach, opacity: 0.6 },
  pipEmpty: { backgroundColor: 'transparent' },
  pipDash: { borderStyle: 'dashed' },
  pipLabel: { fontSize: 10, color: C.faint, fontWeight: '600' },
  pipCount: { fontSize: 10, color: C.bg, fontWeight: '900' },

  todayRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 12 },
  todayCount: { fontSize: 28, fontWeight: '900', color: C.peach },
  todayLabel: { fontSize: 14, color: C.muted },

  doneTodayCount: { fontSize: 14, color: C.peach, fontWeight: '700', marginTop: 2 },

  statsLine: { marginBottom: 20 },
  statsLineText: { fontSize: 13, color: C.muted, textAlign: 'center' },

  mainArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },

  timer: { fontSize: 80, fontWeight: '200', color: C.cream, letterSpacing: 4, fontVariant: ['tabular-nums'] },

  blushOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#ff3a6e', zIndex: 10, pointerEvents: 'none',
  },

  doneArea: { alignItems: 'center', gap: 8 },
  doneText: { fontSize: 64, fontWeight: '900', color: C.peach },
  marathonBadge: { fontSize: 28, letterSpacing: 4 },
  doneSubtitle: { fontSize: 16, color: C.muted },
  eggMsg: { fontSize: 14, color: C.faint, fontStyle: 'italic', textAlign: 'center',
    maxWidth: 240, marginTop: 4 },
  recipeCard: { marginTop: 16, borderWidth: 1, borderColor: C.peach, borderRadius: 12,
    padding: 16, maxWidth: 280, backgroundColor: C.bg2 },
  recipeLabel: { fontSize: 10, color: C.peach, letterSpacing: 1.5, fontWeight: '700', marginBottom: 6 },
  recipeText: { fontSize: 14, color: C.muted, lineHeight: 20 },

  goBtn: { width: 160, height: 160, borderRadius: 80, backgroundColor: C.cream,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.peach, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 12 },
  goBtnText: { fontSize: 32, fontWeight: '900', color: C.bg, letterSpacing: -1 },

  doneBtn: { width: 160, height: 160, borderRadius: 80, backgroundColor: C.peach,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.peachDeep, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 32, elevation: 16 },
  doneBtnText: { fontSize: 28, fontWeight: '900', color: C.bg, letterSpacing: -1 },

  resetBtn: { width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: C.peach,
    alignItems: 'center', justifyContent: 'center' },
  resetBtnText: { fontSize: 28, fontWeight: '900', color: C.peach },

  hint: { fontSize: 13, color: C.faint },
});
