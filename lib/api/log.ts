import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { api } from './client';
import { ConditionScore, MealAmount, StoolCondition, UrineAmount, UrineColor, WaterAmount } from '../types';
import type { ThumbnailFile } from '../photoUtils';

export interface LogPhotoResponse {
  externalId: string;
  dailyLogId?: number;
  petId?: number;
  caregiverId?: number;
  date?: string;
  mediumUrl: string;
  thumbnailUrl: string;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LogResponse {
  externalId: string;
  petExternalId: string;
  date: string;
  meal?: MealAmount;
  mealNote?: string;
  water?: WaterAmount;
  waterNote?: string;
  walkMinutes?: number | null;
  walkNote?: string;
  pooCondition?: StoolCondition;
  pooNote?: string;
  urineColor?: UrineColor;
  urineNote?: string;
  urineAmount?: UrineAmount;
  condition?: ConditionScore;
  weightKg?: number;
  memo?: string;
  playMinutes?: number | null;
  playNote?: string;
  vomitCount?: number;
  vomitNote?: string;
  photos?: LogPhotoResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface LogRequest {
  petExternalId: string;
  caregiverExternalId: string;
  date: string;
  meal?: MealAmount;
  mealNote?: string;
  water?: WaterAmount;
  waterNote?: string;
  walkMinutes?: number | null;
  walkNote?: string;
  pooCondition?: StoolCondition;
  pooNote?: string;
  urineColor?: UrineColor;
  urineNote?: string;
  urineAmount?: UrineAmount;
  condition?: ConditionScore;
  weightKg?: number;
  memo?: string;
  playMinutes?: number | null;
  playNote?: string;
  vomitCount?: number;
  vomitNote?: string;
}

export interface LogFilter {
  petExternalId: string;
  startDate?: string;
  endDate?: string;
}

function appendFileField(formData: FormData, key: string, file: ThumbnailFile) {
  if (file.blob) {
    formData.append(key, file.blob, file.name);
  } else {
    // React Native FormData는 { uri, name, type } 객체로 네이티브 파일 업로드를 지원한다.
    formData.append(key, { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
  }
}

export const logApi = {
  getLogs: (filter: LogFilter) => {
    const params = new URLSearchParams({ petExternalId: filter.petExternalId });
    if (filter.startDate) params.set('startDate', filter.startDate);
    if (filter.endDate) params.set('endDate', filter.endDate);
    return api.get<LogResponse[]>(`/api/v1/logs?${params.toString()}`);
  },

  getLog: (externalId: string) =>
    api.get<LogResponse>(`/api/v1/logs/${externalId}`),

  createLog: (body: LogRequest) =>
    api.post<LogResponse>('/api/v1/logs', body),

  // 신규 기록 생성과 동시에 사진(최대 3장)을 업로드/연결한다. mediums/thumbnails는 인덱스로 매칭된다.
  createLogWithPhotos: async (
    body: LogRequest,
    photos: { medium: ThumbnailFile; thumbnail: ThumbnailFile }[],
  ): Promise<LogResponse> => {
    const formData = new FormData();
    let tempUri: string | null = null;

    if (Platform.OS === 'web') {
      formData.append('request', new Blob([JSON.stringify(body)], { type: 'application/json' }));
    } else {
      // iOS/Android: React Native FormData는 Blob의 Content-Type을 멀티파트 헤더에 포함하지 않아
      // Spring이 'request' 파트를 찾지 못한다. { uri, name, type } 파일 파트 방식을 사용해야 한다.
      const json = JSON.stringify(body);
      tempUri = `${FileSystem.cacheDirectory}log_request_${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(tempUri, json, { encoding: FileSystem.EncodingType.UTF8 });
      formData.append('request', { uri: tempUri, name: 'request.json', type: 'application/json' } as unknown as Blob);
    }

    photos.forEach(({ medium, thumbnail }) => {
      appendFileField(formData, 'mediums', medium);
      appendFileField(formData, 'thumbnails', thumbnail);
    });

    try {
      return await api.postFormData<LogResponse>('/api/v1/logs/with-photos', formData);
    } finally {
      if (tempUri !== null) {
        FileSystem.deleteAsync(tempUri, { idempotent: true }).catch(() => {});
      }
    }
  },

  updateLog: (externalId: string, body: Partial<LogRequest>) =>
    api.put<LogResponse>(`/api/v1/logs/${externalId}`, body),

  deleteLog: (externalId: string) =>
    api.delete<void>(`/api/v1/logs/${externalId}`),

  uploadLogPhoto: (
    logExternalId: string,
    medium: ThumbnailFile,
    thumbnail: ThumbnailFile,
  ): Promise<LogPhotoResponse> => {
    const formData = new FormData();
    appendFileField(formData, 'medium', medium);
    appendFileField(formData, 'thumbnail', thumbnail);

    return api.postFormData<LogPhotoResponse>(
      `/api/v1/logs/${logExternalId}/photos/upload`,
      formData,
    );
  },

  deleteLogPhoto: (logExternalId: string, photoExternalId: string) =>
    api.delete<void>(`/api/v1/logs/${logExternalId}/photos/${photoExternalId}`),
};
