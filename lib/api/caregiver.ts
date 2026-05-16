import { api } from './client';

export interface CaregiverResponse {
  externalId: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaregiverRequest {
  name: string;
  role?: string;
  color?: string;
}

export const caregiverApi = {
  getCaregivers: () =>
    api.get<CaregiverResponse[]>('/api/v1/caregivers'),

  getCaregiver: (externalId: string) =>
    api.get<CaregiverResponse>(`/api/v1/caregivers/${externalId}`),

  createCaregiver: (body: CaregiverRequest) =>
    api.post<CaregiverResponse>('/api/v1/caregivers', body),

  updateCaregiver: (externalId: string, body: Partial<CaregiverRequest>) =>
    api.put<CaregiverResponse>(`/api/v1/caregivers/${externalId}`, body),

  deleteCaregiver: (externalId: string) =>
    api.delete<void>(`/api/v1/caregivers/${externalId}`),
};
