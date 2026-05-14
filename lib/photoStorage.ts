import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const PHOTOS_DIR = FileSystem.documentDirectory + 'daily-photos/';

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

export async function savePhotoToAppDir(
  sourceUri: string,
  petId: string,
  date: string
): Promise<string> {
  if (Platform.OS === 'web') {
    // 웹은 파일 시스템 없음 — blob URL 그대로 사용
    return sourceUri;
  }

  await ensureDir();

  const destUri = PHOTOS_DIR + `${petId}_${date}.jpg`;

  // 같은 날 기존 파일 있으면 덮어쓰기
  const existing = await FileSystem.getInfoAsync(destUri);
  if (existing.exists) {
    await FileSystem.deleteAsync(destUri, { idempotent: true });
  }

  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  return destUri;
}

export async function deletePhotoFile(photoUri: string): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!photoUri.startsWith('file://')) return;

  try {
    await FileSystem.deleteAsync(photoUri, { idempotent: true });
  } catch {
    // 파일 없어도 무시
  }
}
