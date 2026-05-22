import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { SUMMONS, HEALTH_TIPS } from '@/content/summons';
import type { NotificationSettings } from '@/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'GG Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async scheduleAll(settings: NotificationSettings): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!settings.enabled) return;

    const now = new Date();
    const scheduledDates: Date[] = [];

    // Schedule summons notifications across the next 7 days
    for (let day = 0; day < 7; day++) {
      const sessionsPerDay = Math.floor(24 / settings.frequencyHours);
      for (let i = 0; i < sessionsPerDay; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + day);
        date.setHours(settings.windowStart + (i * settings.frequencyHours), 0, 0, 0);

        const fifteenMinutes = 15 * 60 * 1000;
        if (
          date.getHours() >= settings.windowStart &&
          date.getHours() < settings.windowEnd &&
          date.getTime() > now.getTime() + fifteenMinutes
        ) {
          scheduledDates.push(date);
        }
      }
    }

    for (const date of scheduledDates) {
      // Primary summons
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'GG',
          body: pick(SUMMONS),
        },
        trigger: { date },
      });

      // Health tip follow-up 3 minutes later
      const tipDate = new Date(date.getTime() + 3 * 60 * 1000);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'GG | Wellness Note',
          body: pick(HEALTH_TIPS),
        },
        trigger: { date: tipDate },
      });
    }
  },

  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
};
