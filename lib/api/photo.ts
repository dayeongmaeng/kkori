import { logger, toLogError } from '../logger';
import type { ThumbnailFile } from '../photoUtils';
import { api } from './client';

export interface PhotoResponse {
  externalId: string;
  petExternalId?: string;
  petId?: number;
  caregiverId?: number;
  imageUrl?: string;
  date?: string;
  mediumUrl?: string;
  thumbnailUrl?: string;
  takenAt?: string;
  caption?: string;
  memo?: string;
  edited?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PhotoRequest {
  petExternalId: string;
  caregiverExternalId?: string;
  date: string;       // YYYY-MM-DD (LocalDate)
  imageUrl?: string;
  takenAt?: string;
  caption?: string;
  memo?: string;
}

export interface PhotoUpdateRequest {
  caption?: string;
}

export interface PhotoShareResponse {
  petName: string;
  date: string;
  caption?: string;
  mediumUrl?: string;
  thumbnailUrl?: string;
  edited?: boolean;
}

export interface PhotoUploadResponse {
  mediumUrl: string;
  thumbnailUrl: string;
}

export const photoApi = {
  getPhotos: (petExternalId: string) =>
    api.get<PhotoResponse[]>(`/api/v1/photos?petExternalId=${encodeURIComponent(petExternalId)}`),

  getPhoto: (externalId: string) =>
    api.get<PhotoResponse>(`/api/v1/photos/${externalId}`),

  createPhoto: (body: PhotoRequest) =>
    api.post<PhotoResponse>('/api/v1/photos', body),

  updatePhoto: (externalId: string, body: PhotoUpdateRequest) =>
    api.patch<PhotoResponse>(`/api/v1/photos/${externalId}`, body),

  updatePhotoCompat: (externalId: string, body: PhotoUpdateRequest) =>
    api.put<PhotoResponse>(`/api/v1/photos/${externalId}`, body),

  getSharedPhoto: async (externalId: string): Promise<PhotoShareResponse> => {
    const baseUrl = (process.env.EXPO_PUBLIC_SHARE_API_URL ?? 'https://api.kkori.co.kr').replace(/\/$/, '');
    const res = await fetch(`${baseUrl}/api/v1/photos/${encodeURIComponent(externalId)}/share`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`공유 사진 조회 실패: ${res.status}`);
    }

    const json = await res.json();
    return json?.data ?? json;
  },

  deletePhoto: (externalId: string) =>
    api.delete<void>(`/api/v1/photos/${externalId}`),

  uploadPhoto: async (externalId: string, medium: ThumbnailFile, thumbnail: ThumbnailFile): Promise<PhotoUploadResponse> => {
    const formData = new FormData();
    logger.debug('photo.upload.prepare.start', {
      externalId,
      hasMediumBlob: Boolean(medium.blob),
      hasThumbnailBlob: Boolean(thumbnail.blob),
    });

    function appendFile(key: string, file: ThumbnailFile) {
      if (file.blob) {
        formData.append(key, file.blob, file.name);
      } else {
        formData.append(key, { uri: file.uri, name: file.name, type: file.type } as any);
      }
    }

    appendFile('medium', medium);
    appendFile('thumbnail', thumbnail);

    logger.debug('photo.upload.request.start', { externalId });

    try {
      const response = await api.postFormData<PhotoUploadResponse>(`/api/v1/photos/${externalId}/upload`, formData);
      logger.debug('photo.upload.request.success', { externalId });
      return response;
    } catch (error) {
      logger.warn('photo.upload.request.failed', { externalId, ...toLogError(error) });
      throw error;
    }
  },
};
