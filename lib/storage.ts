import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { Caregiver, DailyLog, DailyPhoto, Pet } from './types';

const PETS_KEY = 'pet-care:pets:v1';
const CURRENT_PET_ID_KEY = 'pet-care:current-pet-id:v1';

export async function getPets(): Promise<Pet[]> {
  try {
    const json = await AsyncStorage.getItem(PETS_KEY);
    return json ? (JSON.parse(json) as Pet[]) : [];
  } catch {
    return [];
  }
}

export async function getPet(id: string): Promise<Pet | null> {
  try {
    const pets = await getPets();
    return pets.find((p) => p.id === id) ?? null;
  } catch {
    return null;
  }
}

export async function savePet(pet: Pet): Promise<void> {
  try {
    // caregiverIds 누락 시 현재 보호자 자동 포함
    const caregiverIds =
      pet.caregiverIds.length > 0
        ? pet.caregiverIds
        : [await getCurrentCaregiverId()];

    const pets = await getPets();
    const index = pets.findIndex((p) => p.id === pet.id);
    const petToSave = { ...pet, caregiverIds };
    if (index >= 0) {
      pets[index] = petToSave;
    } else {
      pets.push(petToSave);
    }
    await AsyncStorage.setItem(PETS_KEY, JSON.stringify(pets));
  } catch {
    throw new Error('반려동물 정보 저장에 실패했습니다.');
  }
}

export async function deletePet(id: string): Promise<void> {
  try {
    const pets = await getPets();
    const filtered = pets.filter((p) => p.id !== id);
    await AsyncStorage.setItem(PETS_KEY, JSON.stringify(filtered));

    const currentId = await getCurrentPetId();
    if (currentId === id) {
      await AsyncStorage.removeItem(CURRENT_PET_ID_KEY);
    }
  } catch {
    throw new Error('반려동물 정보 삭제에 실패했습니다.');
  }
}

export async function getCurrentPetId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CURRENT_PET_ID_KEY);
  } catch {
    return null;
  }
}

export async function setCurrentPetId(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(CURRENT_PET_ID_KEY, id);
  } catch {
    throw new Error('현재 반려동물 설정에 실패했습니다.');
  }
}

// ─── Caregiver ───────────────────────────────────────────────────────────────

const CAREGIVERS_KEY = 'pet-care:caregivers:v1';
const CURRENT_CAREGIVER_ID_KEY = 'pet-care:current-caregiver-id:v1';

const DEFAULT_CAREGIVER_ID = 'caregiver_default';

async function getAllCaregivers(): Promise<Caregiver[]> {
  try {
    const json = await AsyncStorage.getItem(CAREGIVERS_KEY);
    return json ? (JSON.parse(json) as Caregiver[]) : [];
  } catch {
    return [];
  }
}

export async function getCaregivers(): Promise<Caregiver[]> {
  const all = await getAllCaregivers();
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getCaregiverById(id: string): Promise<Caregiver | null> {
  const all = await getAllCaregivers();
  return all.find((c) => c.id === id) ?? null;
}

export async function saveCaregiver(caregiver: Caregiver): Promise<void> {
  try {
    const all = await getAllCaregivers();
    const index = all.findIndex((c) => c.id === caregiver.id);
    if (index >= 0) {
      all[index] = caregiver;
    } else {
      all.push(caregiver);
    }
    await AsyncStorage.setItem(CAREGIVERS_KEY, JSON.stringify(all));
  } catch {
    throw new Error('보호자 정보 저장에 실패했습니다.');
  }
}

export async function deleteCaregiver(id: string): Promise<void> {
  const target = await getCaregiverById(id);
  if (target?.role === 'owner') {
    throw new Error('주 보호자는 삭제할 수 없습니다.');
  }
  try {
    const all = await getAllCaregivers();
    const filtered = all.filter((c) => c.id !== id);
    await AsyncStorage.setItem(CAREGIVERS_KEY, JSON.stringify(filtered));
  } catch {
    throw new Error('보호자 삭제에 실패했습니다.');
  }
}

export async function getCurrentCaregiverId(): Promise<string> {
  try {
    const storedId = await AsyncStorage.getItem(CURRENT_CAREGIVER_ID_KEY);
    if (storedId) {
      const exists = await getCaregiverById(storedId);
      if (exists) return storedId;
    }

    // 저장된 ID 없거나 보호자가 실제로 없으면 기본 보호자 자동 생성
    const defaultCaregiver: Caregiver = {
      id: DEFAULT_CAREGIVER_ID,
      name: '나',
      role: 'owner',
      color: '#E8985C',
      createdAt: new Date().toISOString(),
    };
    await saveCaregiver(defaultCaregiver);
    await AsyncStorage.setItem(CURRENT_CAREGIVER_ID_KEY, DEFAULT_CAREGIVER_ID);
    return DEFAULT_CAREGIVER_ID;
  } catch {
    return DEFAULT_CAREGIVER_ID;
  }
}

export async function setCurrentCaregiverId(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(CURRENT_CAREGIVER_ID_KEY, id);
  } catch {
    throw new Error('현재 보호자 설정에 실패했습니다.');
  }
}

// ─── DailyPhoto ──────────────────────────────────────────────────────────────

const DAILY_PHOTOS_KEY = 'pet-care:daily-photos:v1';

async function getAllDailyPhotos(): Promise<DailyPhoto[]> {
  try {
    const json = await AsyncStorage.getItem(DAILY_PHOTOS_KEY);
    return json ? (JSON.parse(json) as DailyPhoto[]) : [];
  } catch {
    return [];
  }
}

export async function getDailyPhotos(petId: string): Promise<DailyPhoto[]> {
  const all = await getAllDailyPhotos();
  return all
    .filter((p) => p.petId === petId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getDailyPhotoByDate(petId: string, date: string): Promise<DailyPhoto | null> {
  const all = await getAllDailyPhotos();
  return all.find((p) => p.petId === petId && p.date === date) ?? null;
}

export async function getDailyPhotoById(id: string): Promise<DailyPhoto | null> {
  const all = await getAllDailyPhotos();
  return all.find((p) => p.id === id) ?? null;
}

export async function saveDailyPhoto(photo: DailyPhoto): Promise<{ replaced: boolean }> {
  const all = await getAllDailyPhotos();
  const existing = all.find((p) => p.petId === photo.petId && p.date === photo.date);
  if (existing) {
    throw new Error('이미 해당 날짜에 사진이 있습니다. 먼저 삭제 후 다시 시도해주세요.');
  }
  try {
    // caregiverId 누락 시 현재 보호자 자동 설정
    const caregiverId = photo.caregiverId || (await getCurrentCaregiverId());
    all.push({ ...photo, caregiverId });
    await AsyncStorage.setItem(DAILY_PHOTOS_KEY, JSON.stringify(all));
    return { replaced: false };
  } catch {
    throw new Error('사진 저장에 실패했습니다.');
  }
}

export async function deleteDailyPhoto(id: string): Promise<void> {
  try {
    const all = await getAllDailyPhotos();
    const target = all.find((p) => p.id === id);
    if (!target) return;

    // 네이티브에서만 실제 파일 삭제 (웹의 blob URL은 파일 시스템 없음)
    if (Platform.OS !== 'web' && target.photoUri.startsWith('file://')) {
      const info = await FileSystem.getInfoAsync(target.photoUri);
      if (info.exists) await FileSystem.deleteAsync(target.photoUri, { idempotent: true });
    }

    const filtered = all.filter((p) => p.id !== id);
    await AsyncStorage.setItem(DAILY_PHOTOS_KEY, JSON.stringify(filtered));
  } catch {
    throw new Error('사진 삭제에 실패했습니다.');
  }
}

// ─── DailyLog ────────────────────────────────────────────────────────────────

const DAILY_LOGS_KEY = 'pet-care:daily-logs:v1';

async function getAllDailyLogs(): Promise<DailyLog[]> {
  try {
    const json = await AsyncStorage.getItem(DAILY_LOGS_KEY);
    return json ? (JSON.parse(json) as DailyLog[]) : [];
  } catch {
    return [];
  }
}

export async function getDailyLogs(petId: string): Promise<DailyLog[]> {
  const all = await getAllDailyLogs();
  return all
    .filter((log) => log.petId === petId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getDailyLogByDate(petId: string, date: string): Promise<DailyLog | null> {
  const all = await getAllDailyLogs();
  return all.find((log) => log.petId === petId && log.date === date) ?? null;
}

export async function getDailyLogById(id: string): Promise<DailyLog | null> {
  const all = await getAllDailyLogs();
  return all.find((log) => log.id === id) ?? null;
}

export async function saveDailyLog(log: DailyLog): Promise<{ replaced: boolean }> {
  try {
    const caregiverId = log.caregiverId || (await getCurrentCaregiverId());
    const all = await getAllDailyLogs();
    const index = all.findIndex((l) => l.petId === log.petId && l.date === log.date);
    const now = new Date().toISOString();
    if (index >= 0) {
      all[index] = { ...log, caregiverId, updatedAt: now };
      await AsyncStorage.setItem(DAILY_LOGS_KEY, JSON.stringify(all));
      return { replaced: true };
    }
    all.push({ ...log, caregiverId, createdAt: now, updatedAt: now });
    await AsyncStorage.setItem(DAILY_LOGS_KEY, JSON.stringify(all));
    return { replaced: false };
  } catch {
    throw new Error('일일 기록 저장에 실패했습니다.');
  }
}

export async function deleteDailyLog(id: string): Promise<void> {
  try {
    const all = await getAllDailyLogs();
    const filtered = all.filter((log) => log.id !== id);
    await AsyncStorage.setItem(DAILY_LOGS_KEY, JSON.stringify(filtered));
  } catch {
    throw new Error('일일 기록 삭제에 실패했습니다.');
  }
}

// ─── Migration ────────────────────────────────────────────────────────────────

const MIGRATION_CAREGIVER_KEY = 'pet-care:migration:v1:caregiver';

export async function migrateLegacyData(): Promise<void> {
  try {
    const done = await AsyncStorage.getItem(MIGRATION_CAREGIVER_KEY);
    if (done === 'true') return;

    const caregiverId = await getCurrentCaregiverId();

    // Pet.caregiverIds 누락된 항목 보정
    const pets = await getPets();
    const petsNeedMigration = pets.some((p) => !p.caregiverIds || p.caregiverIds.length === 0);
    if (petsNeedMigration) {
      const migrated = pets.map((p) => ({
        ...p,
        caregiverIds: p.caregiverIds?.length > 0 ? p.caregiverIds : [caregiverId],
      }));
      await AsyncStorage.setItem(PETS_KEY, JSON.stringify(migrated));
    }

    // DailyPhoto.caregiverId 누락된 항목 보정
    const photos = await getAllDailyPhotos();
    const photosNeedMigration = photos.some((p) => !p.caregiverId);
    if (photosNeedMigration) {
      const migrated = photos.map((p) => ({
        ...p,
        caregiverId: p.caregiverId || caregiverId,
      }));
      await AsyncStorage.setItem(DAILY_PHOTOS_KEY, JSON.stringify(migrated));
    }

    // DailyLog.caregiverId 누락된 항목 보정
    const logs = await getAllDailyLogs();
    const logsNeedMigration = logs.some((l) => !l.caregiverId);
    if (logsNeedMigration) {
      const migrated = logs.map((l) => ({
        ...l,
        caregiverId: l.caregiverId || caregiverId,
      }));
      await AsyncStorage.setItem(DAILY_LOGS_KEY, JSON.stringify(migrated));
    }

    await AsyncStorage.setItem(MIGRATION_CAREGIVER_KEY, 'true');
  } catch {
    // 마이그레이션 실패는 앱 실행을 막지 않음 — 다음 실행에서 재시도
  }
}
