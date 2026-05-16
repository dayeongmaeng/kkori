import { api } from './client';

export interface PhotoResponse {
  externalId: string;
  petExternalId: string;
  imageUrl: string;
  takenAt: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PhotoRequest {
  petExternalId: string;
  caregiverExternalId?: string;
  date: string;       // YYYY-MM-DD (LocalDate)
  imageUrl?: string;  // 향후 서버 업로드 구현 시 사용
  takenAt: string;
  memo?: string;
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
};
