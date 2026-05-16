import AsyncStorage from '@react-native-async-storage/async-storage';

import { PhotoResponse } from '../api/photo';
import { getPhotoLocal } from '../photoLocalCache';

export interface LocalPhoto {
  externalId: string;
  petExternalId: string;
  date: string;       // YYYY-MM-DD
  photoUri?: string;  // 로컬 base64/URI. 다른 기기에서 생성된 경우 undefined
  caption?: string;
  createdAt: string;
}

function cacheKey(petExternalId: string) {
  return `pet-care:api:photos:${petExternalId}`;
}

export async function getCachedPhotos(petExternalId: string): Promise<PhotoResponse[]> {
  try {
    const json = await AsyncStorage.getItem(cacheKey(petExternalId));
    return json ? (JSON.parse(json) as PhotoResponse[]) : [];
  } catch {
    return [];
  }
}

export async function setCachedPhotos(
  petExternalId: string,
  photos: PhotoResponse[],
): Promise<void> {
  await AsyncStorage.setItem(cacheKey(petExternalId), JSON.stringify(photos));
}

export async function upsertCachedPhoto(
  petExternalId: string,
  photo: PhotoResponse,
): Promise<void> {
  const photos = await getCachedPhotos(petExternalId);
  const idx = photos.findIndex((p) => p.externalId === photo.externalId);
  if (idx >= 0) photos[idx] = photo; else photos.push(photo);
  await setCachedPhotos(petExternalId, photos);
}

export async function removeCachedPhoto(
  petExternalId: string,
  externalId: string,
): Promise<void> {
  const photos = await getCachedPhotos(petExternalId);
  await setCachedPhotos(petExternalId, photos.filter((p) => p.externalId !== externalId));
}

export async function mergeWithLocal(input: unknown): Promise<LocalPhoto[]> {
  console.log('[mergeWithLocal] 입력 타입:', typeof input, Array.isArray(input) ? `배열(${(input as any[]).length})` : JSON.stringify(input)?.slice(0, 200));

  // 서버가 배열 대신 다른 구조를 반환할 경우 안전하게 추출
  let photos: unknown[];
  if (Array.isArray(input)) {
    photos = input;
  } else if (input != null && typeof input === 'object') {
    // 페이지네이션 응답: { content: [...] } 형태 대응
    const obj = input as Record<string, unknown>;
    const candidate = obj['content'] ?? obj['data'] ?? obj['items'] ?? obj['list'];
    photos = Array.isArray(candidate) ? candidate : [];
    console.warn('[mergeWithLocal] 배열 아님 — 내부 필드 추출 시도:', Object.keys(obj), '→', photos.length, '건');
  } else {
    console.error('[mergeWithLocal] 예상치 못한 입력:', input);
    photos = [];
  }

  // 각 항목 유효성 검사
  const valid = photos.filter((p): p is PhotoResponse => {
    if (p == null || typeof p !== 'object') {
      console.warn('[mergeWithLocal] null/비객체 항목 스킵:', p);
      return false;
    }
    const obj = p as Partial<PhotoResponse>;
    if (!obj.externalId) {
      console.warn('[mergeWithLocal] externalId 누락 스킵:', obj);
      return false;
    }
    return true;
  });

  const merged = await Promise.all(
    valid.map(async (p) => ({
      externalId: p.externalId,
      petExternalId: p.petExternalId ?? '',
      date: p.takenAt ? p.takenAt.slice(0, 10) : (p.createdAt?.slice(0, 10) ?? ''),
      photoUri: await getPhotoLocal(p.externalId),
      caption: p.memo,
      createdAt: p.createdAt ?? '',
    })),
  );

  return merged
    .filter((p) => p.date !== '')
    .sort((a, b) => b.date.localeCompare(a.date));
}
