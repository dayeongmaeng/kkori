import AsyncStorage from '@react-native-async-storage/async-storage';

import { PhotoResponse } from '../api/photo';
import { logger } from '../logger';
import { getPhotoLocal } from '../photoLocalCache';

export interface LocalPhoto {
  externalId: string;
  petExternalId: string;
  date: string;       // YYYY-MM-DD
  photoUri?: string;  // 로컬 base64. 다른 기기에서 생성된 경우 undefined
  mediumUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  edited?: boolean;
  createdAt: string;
  updatedAt: string;
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
  logger.debug('photo.cache.merge.input', {
    type: typeof input,
    isArray: Array.isArray(input),
    count: Array.isArray(input) ? (input as unknown[]).length : undefined,
  });

  // 서버가 배열 대신 다른 구조를 반환할 경우 안전하게 추출
  let photos: unknown[];
  if (Array.isArray(input)) {
    photos = input;
  } else if (input != null && typeof input === 'object') {
    // 페이지네이션 응답: { content: [...] } 형태 대응
    const obj = input as Record<string, unknown>;
    const candidate = obj['content'] ?? obj['data'] ?? obj['items'] ?? obj['list'];
    photos = Array.isArray(candidate) ? candidate : [];
    logger.warn('photo.cache.merge.not_array', { keys: Object.keys(obj), resolvedCount: photos.length });
  } else {
    logger.error('photo.cache.merge.invalid_input', { inputType: typeof input });
    photos = [];
  }

  // 각 항목 유효성 검사
  const valid = photos.filter((p): p is PhotoResponse => {
    if (p == null || typeof p !== 'object') {
      logger.warn('photo.cache.merge.skip_null_item');
      return false;
    }
    const obj = p as Partial<PhotoResponse>;
    if (!obj.externalId) {
      logger.warn('photo.cache.merge.skip_missing_id');
      return false;
    }
    return true;
  });

  const merged = await Promise.all(
    valid.map(async (p) => ({
      externalId: p.externalId,
      petExternalId: p.petExternalId ?? '',
      date: p.date ?? (p.takenAt ? p.takenAt.slice(0, 10) : (p.createdAt?.slice(0, 10) ?? '')),
      photoUri: await getPhotoLocal(p.externalId),
      mediumUrl: p.mediumUrl,
      thumbnailUrl: p.thumbnailUrl,
      caption: p.caption ?? p.memo,
      edited: p.edited ?? (Boolean(p.createdAt && p.updatedAt) && p.createdAt !== p.updatedAt),
      createdAt: p.createdAt ?? '',
      updatedAt: p.updatedAt ?? '',
    })),
  );

  return merged
    .filter((p) => p.date !== '')
    .sort((a, b) => b.date.localeCompare(a.date));
}
