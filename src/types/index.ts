export interface Session {
  id: string;
  startedAt: number;
  durationSeconds: number;
}

export interface AppStats {
  streak: number;
  bestStreak: number;
  totalSessions: number;
  lastSessionAt: number | null;
  weeklyCount: number;
  longestSessionSec: number;
  totalSecTracked: number;
  sessions: Session[];
  weeklySkipUsedAt: number | null;
}

export interface HeatmapCell {
  date: string;       // YYYY-MM-DD
  intensity: 0 | 1 | 2 | 3;
}

export interface NotificationSettings {
  enabled: boolean;
  windowStart: number;
  windowEnd: number;
  frequencyHours: number;
}
