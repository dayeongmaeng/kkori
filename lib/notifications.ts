import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { logger, toLogError } from './logger';

export const NOTIFICATION_TIME_KEY = 'pet-care:notification-time';
export const DEFAULT_NOTIFICATION_HOUR = 22;
export const DEFAULT_NOTIFICATION_MINUTE = 0;

const ANDROID_CHANNEL_ID = 'daily-reminder';

export interface NotificationTime {
  hour: number;
  minute: number;
}

export async function loadNotificationTime(): Promise<NotificationTime> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_TIME_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<NotificationTime>;
      if (typeof parsed.hour === 'number' && typeof parsed.minute === 'number') {
        return { hour: parsed.hour, minute: parsed.minute };
      }
    }
  } catch {}
  return { hour: DEFAULT_NOTIFICATION_HOUR, minute: DEFAULT_NOTIFICATION_MINUTE };
}

export async function saveNotificationTime(time: NotificationTime): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_TIME_KEY, JSON.stringify(time));
}

export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  if (Platform.OS === 'web') return 'denied';
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: '일일 리마인더',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function scheduleDailyNotification(hour: number, minute: number): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '꼬리',
        body: '반려동물의 하루를 남겨보세요.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    logger.info('notification.schedule.success', { hour, minute });
  } catch (error) {
    logger.warn('notification.schedule.failed', toLogError(error));
    throw error;
  }
}
