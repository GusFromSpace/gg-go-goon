import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppStats, NotificationSettings, SubscriptionState } from '@/types';

const KEYS = {
  STATS: 'gg:stats',
  SESSIONS: 'gg:sessions',
  NOTIFICATION_SETTINGS: 'gg:notif_settings',
  AGE_VERIFIED: 'gg:age_verified',
  TOS_ACCEPTED: 'gg:tos_accepted',
  SUBSCRIPTION: 'gg:subscription',
} as const;

const DEFAULT_STATS: AppStats = {
  streak: 0,
  totalSessions: 0,
  lastSessionAt: null,
  weeklyCount: 0,
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  windowStart: 8,
  windowEnd: 22,
  frequencyHours: 8,
};

export const storage = {
  async getStats(): Promise<AppStats> {
    const raw = await AsyncStorage.getItem(KEYS.STATS);
    return raw ? JSON.parse(raw) : DEFAULT_STATS;
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

  async getSubscription(): Promise<SubscriptionState> {
    const raw = await AsyncStorage.getItem(KEYS.SUBSCRIPTION);
    return raw ? JSON.parse(raw) : { isFindom: false, expiresAt: null };
  },

  async saveSubscription(state: SubscriptionState): Promise<void> {
    await AsyncStorage.setItem(KEYS.SUBSCRIPTION, JSON.stringify(state));
  },

  async recordSession(durationSeconds: number): Promise<AppStats> {
    const stats = await this.getStats();
    const now = Date.now();
    const oneDayMs = 86400000;
    const isConsecutive = stats.lastSessionAt
      ? now - stats.lastSessionAt < oneDayMs * 2
      : false;

    const updated: AppStats = {
      streak: isConsecutive ? stats.streak + 1 : 1,
      totalSessions: stats.totalSessions + 1,
      lastSessionAt: now,
      weeklyCount: stats.weeklyCount + 1,
    };

    await this.saveStats(updated);
    return updated;
  },
};
