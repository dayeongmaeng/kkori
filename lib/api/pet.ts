import { api } from './client';

export interface PetResponse {
  externalId: string;
  name: string;
  species: string;
  breed?: string;
  birthDate?: string;
  gender?: 'male' | 'female';
  weightKg?: number;
  neutered?: boolean;
  medicalNotes?: string;
  photoBase64?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PetRequest {
  name: string;
  species: string;
  breed?: string;
  birthDate?: string;
  gender?: 'male' | 'female';
  weightKg?: number;
  neutered?: boolean;
  medicalNotes?: string;
  photoBase64?: string;
}

export const petApi = {
  getPets: () =>
    api.get<PetResponse[]>('/api/v1/pets'),

  getPet: (externalId: string) =>
    api.get<PetResponse>(`/api/v1/pets/${externalId}`),

  createPet: (body: PetRequest) =>
    api.post<PetResponse>('/api/v1/pets', body),

  updatePet: (externalId: string, body: Partial<PetRequest>) =>
    api.put<PetResponse>(`/api/v1/pets/${externalId}`, body),

  deletePet: (externalId: string) =>
    api.delete<void>(`/api/v1/pets/${externalId}`),
};
