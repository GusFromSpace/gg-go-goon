import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { SUMMONS, HEALTH_TIPS } from '@/content/summons';
import type { NotificationSettings } from '@/types';

// expo-notifications remote push was removed from Expo Go in SDK 53.
// Local scheduled notifications require a development build.
// In Expo Go we run in no-op mode so the rest of the app is testable.
const isExpoGo = Constants.appOwnership === 'expo';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Lazy-load the module so it never imports in Expo Go
async function getNotifications() {
  if (isExpoGo) return null;
  return await import('expo-notifications');
}

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    const Notifications = await getNotifications();
    if (!Notifications) {
      console.log('[Notifications] Expo Go — skipping permission request');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('gg-reminders', {
        name: 'GG Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
      });
      await Notifications.setNotificationChannelAsync('gg-wellness', {
        name: 'GG Wellness Notes',
        importance: Notifications.AndroidImportance.LOW,
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async scheduleAll(settings: NotificationSettings): Promise<void> {
    const Notifications = await getNotifications();
    if (!Notifications) return;

    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!settings.enabled) return;

    const now = new Date();
    const scheduledDates: Date[] = [];
    const fifteenMinutes = 15 * 60 * 1000;

    for (let day = 0; day < 7; day++) {
      const sessionsPerDay = Math.floor(24 / settings.frequencyHours);
      for (let i = 0; i < sessionsPerDay; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + day);
        date.setHours(settings.windowStart + (i * settings.frequencyHours), 0, 0, 0);

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
      await Notifications.scheduleNotificationAsync({
        content: { title: 'GG', body: pick(SUMMONS) },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
          channelId: 'gg-reminders',
        },
      });

      const tipDate = new Date(date.getTime() + 3 * 60 * 1000);
      await Notifications.scheduleNotificationAsync({
        content: { title: 'GG | Wellness Note', body: pick(HEALTH_TIPS) },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: tipDate,
          channelId: 'gg-wellness',
        },
      });
    }
  },

  async cancelAll(): Promise<void> {
    const Notifications = await getNotifications();
    if (!Notifications) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
};
