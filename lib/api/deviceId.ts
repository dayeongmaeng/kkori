import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { deviceApi } from './device';

const STORAGE_KEY = 'pet-care:device-id';

/**
 * 앱 시작 시 1회 호출. 최초 실행이면 UUID를 생성해 서버에 등록하고 저장한다.
 * 이후 모든 요청은 client.ts가 AsyncStorage에서 직접 읽어 헤더를 붙인다.
 */
export async function initDeviceId(): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (stored) return;

  const id = crypto.randomUUID();
  await deviceApi.register({ externalId: id, platform: Platform.OS });
  await AsyncStorage.setItem(STORAGE_KEY, id);
}
