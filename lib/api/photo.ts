import { api } from './client';
import type { ThumbnailFile } from '../photoUtils';

export interface PhotoResponse {
  externalId: string;
  petExternalId: string;
  imageUrl: string;
  mediumUrl?: string;
  thumbnailUrl?: string;
  takenAt: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PhotoRequest {
  petExternalId: string;
  caregiverExternalId?: string;
  date: string;       // YYYY-MM-DD (LocalDate)
  imageUrl?: string;
  takenAt: string;
  memo?: string;
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

  updatePhoto: (externalId: string, body: Partial<PhotoRequest>) =>
    api.put<PhotoResponse>(`/api/v1/photos/${externalId}`, body),

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
