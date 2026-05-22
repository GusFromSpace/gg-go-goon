export type NotificationTier = 'summons' | 'health';

export interface Session {
  id: string;
  startedAt: number;
  durationSeconds: number;
}

export interface AppStats {
  streak: number;
  totalSessions: number;
  lastSessionAt: number | null;
  weeklyCount: number;
}

export interface NotificationSettings {
  enabled: boolean;
  windowStart: number; // hour 0-23
  windowEnd: number;   // hour 0-23
  frequencyHours: number;
}

export interface SubscriptionState {
  isFindom: boolean;
  expiresAt: number | null;
}
