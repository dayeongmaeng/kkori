import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogResponse } from '../api/log';

const logsKey = (petId: string) => `pet-care:api:logs:${petId}`;
const logExtrasKey = (id: string) => `pet-care:log-extras:${id}`;
const logPhotosKey = (id: string) => `pet-care:log-photos:${id}`;

// 서버에 없는 메모 필드만 로컬 보관
export interface LogLocalExtras {
  mealNote?: string;
  walkNote?: string;
  pooNote?: string;
  waterNote?: string;
}

export async function getCachedLogs(petExternalId: string): Promise<LogResponse[]> {
  try {
    const json = await AsyncStorage.getItem(logsKey(petExternalId));
    return json ? (JSON.parse(json) as LogResponse[]) : [];
  } catch {
    return [];
  }
}

export async function setCachedLogs(petExternalId: string, logs: LogResponse[]): Promise<void> {
  await AsyncStorage.setItem(logsKey(petExternalId), JSON.stringify(logs));
}

export async function getCachedLogByDate(petExternalId: string, date: string): Promise<LogResponse | null> {
  const logs = await getCachedLogs(petExternalId);
  return logs.find((l) => l.date === date) ?? null;
}

export async function upsertCachedLog(petExternalId: string, log: LogResponse): Promise<void> {
  const logs = await getCachedLogs(petExternalId);
  const idx = logs.findIndex((l) => l.date === log.date);
  if (idx >= 0) logs[idx] = log; else logs.push(log);
  await setCachedLogs(petExternalId, logs);
}

export async function removeCachedLog(
  petExternalId: string,
  logExternalId: string,
  date?: string,
): Promise<void> {
  const logs = await getCachedLogs(petExternalId);
  const filtered = logs.filter((l) => l.externalId !== logExternalId && (!date || l.date !== date));
  await setCachedLogs(petExternalId, filtered);
  await AsyncStorage.removeItem(logExtrasKey(logExternalId));
  await AsyncStorage.removeItem(logPhotosKey(logExternalId));
}

export async function getLogLocalExtras(logExternalId: string): Promise<LogLocalExtras> {
  try {
    const json = await AsyncStorage.getItem(logExtrasKey(logExternalId));
    return json ? (JSON.parse(json) as LogLocalExtras) : {};
  } catch {
    return {};
  }
}

export async function setLogLocalExtras(logExternalId: string, extras: LogLocalExtras): Promise<void> {
  await AsyncStorage.setItem(logExtrasKey(logExternalId), JSON.stringify(extras));
}

export async function getLogPhotos(logExternalId: string): Promise<string[]> {
  try {
    const json = await AsyncStorage.getItem(logPhotosKey(logExternalId));
    return json ? (JSON.parse(json) as string[]) : [];
  } catch {
    return [];
  }
}

export async function setLogPhotos(logExternalId: string, uris: string[]): Promise<void> {
  await AsyncStorage.setItem(logPhotosKey(logExternalId), JSON.stringify(uris));
}
