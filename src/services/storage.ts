import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppStats, NotificationSettings, HeatmapCell, Session } from '@/types';

const KEYS = {
  STATS: 'gg:stats',
  NOTIFICATION_SETTINGS: 'gg:notif_settings',
  AGE_VERIFIED: 'gg:age_verified',
  TOS_ACCEPTED: 'gg:tos_accepted',
  ONBOARDED: 'gg:onboarded',
  APP_LOCK: 'gg:app_lock',
} as const;

const DEFAULT_STATS: AppStats = {
  streak: 0,
  bestStreak: 0,
  totalSessions: 0,
  lastSessionAt: null,
  weeklyCount: 0,
  longestSessionSec: 0,
  totalSecTracked: 0,
  sessions: [],
  weeklySkipUsedAt: null,
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  windowStart: 8,
  windowEnd: 22,
  frequencyHours: 8,
};

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfWeek(ts: number) {
  const d = new Date(ts);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dateString(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

export const storage = {
  async getStats(): Promise<AppStats> {
    const raw = await AsyncStorage.getItem(KEYS.STATS);
    return raw ? { ...DEFAULT_STATS, ...JSON.parse(raw) } : DEFAULT_STATS;
  },

  async saveStats(stats: AppStats): Promise<void> {
    await AsyncStorage.setItem(KEYS.STATS, JSON.stringify(stats));
  },

  async getNotificationSettings(): Promise<NotificationSettings> {
    const raw = await AsyncStorage.getItem(KEYS.NOTIFICATION_SETTINGS);
    return raw ? JSON.parse(raw) : DEFAULT_NOTIFICATION_SETTINGS;
  },

  async saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    await AsyncStorage.setItem(KEYS.NOTIFICATION_SETTINGS, JSON.stringify(settings));
  },

  async isAgeVerified(): Promise<boolean> {
    return (await AsyncStorage.getItem(KEYS.AGE_VERIFIED)) === 'true';
  },

  async setAgeVerified(): Promise<void> {
    await AsyncStorage.setItem(KEYS.AGE_VERIFIED, 'true');
  },

  async isTosAccepted(): Promise<boolean> {
    return (await AsyncStorage.getItem(KEYS.TOS_ACCEPTED)) === 'true';
  },

  async setTosAccepted(): Promise<void> {
    await AsyncStorage.setItem(KEYS.TOS_ACCEPTED, 'true');
  },

  async isOnboarded(): Promise<boolean> {
    return (await AsyncStorage.getItem(KEYS.ONBOARDED)) === 'true';
  },

  async setOnboarded(): Promise<void> {
    await AsyncStorage.setItem(KEYS.ONBOARDED, 'true');
  },

  async getAppLockEnabled(): Promise<boolean> {
    return (await AsyncStorage.getItem(KEYS.APP_LOCK)) === 'true';
  },

  async setAppLockEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.APP_LOCK, enabled ? 'true' : 'false');
  },

  async recordSession(durationSeconds: number): Promise<AppStats> {
    const stats = await this.getStats();
    const now = Date.now();
    const todayStart = startOfDay(now);
    const yesterdayStart = todayStart - 86400000;
    const thisWeekStart = startOfWeek(now);

    const session: Session = {
      id: `${now}-${Math.random().toString(36).slice(2)}`,
      startedAt: now,
      durationSeconds,
    };

    const sessions = [...(stats.sessions ?? []), session].slice(-365);
    const totalSecTracked = (stats.totalSecTracked ?? 0) + durationSeconds;
    const longestSessionSec = Math.max(stats.longestSessionSec ?? 0, durationSeconds);
    const totalSessions = stats.totalSessions + 1;
    const weeklyCount = stats.weeklyCount + 1;

    // Streak logic
    let streak = stats.streak;
    let weeklySkipUsedAt = stats.weeklySkipUsedAt;
    const lastSession = stats.lastSessionAt;

    if (!lastSession) {
      streak = 1;
    } else {
      const lastDayStart = startOfDay(lastSession);
      if (lastDayStart >= todayStart) {
        // Already played today — no streak change
      } else if (lastDayStart >= yesterdayStart) {
        // Consecutive day
        streak += 1;
      } else {
        // Missed days — check grace
        const skipAvailable = !weeklySkipUsedAt || weeklySkipUsedAt < thisWeekStart;
        if (skipAvailable) {
          weeklySkipUsedAt = now;
          // streak stays
        } else {
          streak = 1;
          weeklySkipUsedAt = null;
        }
      }
    }

    const bestStreak = Math.max(stats.bestStreak ?? 0, streak);

    const updated: AppStats = {
      streak,
      bestStreak,
      totalSessions,
      lastSessionAt: now,
      weeklyCount,
      longestSessionSec,
      totalSecTracked,
      sessions,
      weeklySkipUsedAt,
    };

    await this.saveStats(updated);
    return updated;
  },

  async getHeatmap(weeks = 18): Promise<HeatmapCell[][]> {
    const stats = await this.getStats();
    const sessions = stats.sessions ?? [];
    const now = Date.now();
    const totalDays = weeks * 7;

    const countsByDate: Record<string, number> = {};
    for (const s of sessions) {
      const d = dateString(s.startedAt);
      countsByDate[d] = (countsByDate[d] ?? 0) + 1;
    }

    const grid: HeatmapCell[][] = [];
    for (let col = 0; col < weeks; col++) {
      const column: HeatmapCell[] = [];
      for (let row = 0; row < 7; row++) {
        const daysAgo = totalDays - (col * 7 + row) - 1;
        const ts = now - daysAgo * 86400000;
        const date = dateString(ts);
        const count = countsByDate[date] ?? 0;
        const intensity = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : 3;
        column.push({ date, intensity: intensity as 0 | 1 | 2 | 3 });
      }
      grid.push(column);
    }

    return grid;
  },

  async getDayOfWeekDistribution(): Promise<number[]> {
    const stats = await this.getStats();
    const dist = [0, 0, 0, 0, 0, 0, 0]; // Mon–Sun
    for (const s of stats.sessions ?? []) {
      const day = new Date(s.startedAt).getDay();
      const idx = day === 0 ? 6 : day - 1;
      dist[idx]++;
    }
    return dist;
  },

  async getPeakHour(): Promise<number | null> {
    const stats = await this.getStats();
    if (!stats.sessions?.length) return null;
    const counts: number[] = Array(24).fill(0);
    for (const s of stats.sessions) {
      counts[new Date(s.startedAt).getHours()]++;
    }
    return counts.indexOf(Math.max(...counts));
  },

  async getAverageSessionSec(): Promise<number> {
    const stats = await this.getStats();
    if (!stats.sessions?.length) return 0;
    return Math.round(stats.totalSecTracked / stats.sessions.length);
  },
};
