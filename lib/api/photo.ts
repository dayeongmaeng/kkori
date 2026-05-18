import { api } from './client';
import type { ThumbnailFile } from '../photoUtils';

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
  mediumUrl: string;
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

  getSharedPhoto: (externalId: string) =>
    api.get<PhotoShareResponse>(`/api/v1/photos/${externalId}/share`, true),

  deletePhoto: (externalId: string) =>
    api.delete<void>(`/api/v1/photos/${externalId}`),

  uploadPhoto: async (externalId: string, medium: ThumbnailFile, thumbnail: ThumbnailFile): Promise<PhotoUploadResponse> => {
    const formData = new FormData();

    function appendFile(key: string, file: ThumbnailFile) {
      if (file.blob) {
        formData.append(key, file.blob, file.name);
      } else {
        formData.append(key, { uri: file.uri, name: file.name, type: file.type } as any);
      }
    }

    appendFile('medium', medium);
    appendFile('thumbnail', thumbnail);

    return api.postFormData<PhotoUploadResponse>(`/api/v1/photos/${externalId}/upload`, formData);
  },
};
