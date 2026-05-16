import AsyncStorage from '@react-native-async-storage/async-storage';

import { PetResponse } from '../api/pet';

const PETS_KEY = 'pet-care:api:pets';
const CURRENT_PET_ID_KEY = 'pet-care:api:current-pet-id';

export async function getCachedPets(): Promise<PetResponse[]> {
  try {
    const json = await AsyncStorage.getItem(PETS_KEY);
    return json ? (JSON.parse(json) as PetResponse[]) : [];
  } catch {
    return [];
  }
}

export async function setCachedPets(pets: PetResponse[]): Promise<void> {
  await AsyncStorage.setItem(PETS_KEY, JSON.stringify(pets));
}

export async function getCachedPet(externalId: string): Promise<PetResponse | null> {
  const pets = await getCachedPets();
  return pets.find((p) => p.externalId === externalId) ?? null;
}

export async function upsertCachedPet(pet: PetResponse): Promise<void> {
  const pets = await getCachedPets();
  const idx = pets.findIndex((p) => p.externalId === pet.externalId);
  if (idx >= 0) pets[idx] = pet; else pets.push(pet);
  await setCachedPets(pets);
}

export async function getCachedCurrentPetId(): Promise<string | null> {
  return AsyncStorage.getItem(CURRENT_PET_ID_KEY);
}

export async function setCachedCurrentPetId(id: string): Promise<void> {
  await AsyncStorage.setItem(CURRENT_PET_ID_KEY, id);
}

export async function getCachedPetPhoto(externalId: string): Promise<string | undefined> {
  const val = await AsyncStorage.getItem(`pet-care:api:pet-photo:${externalId}`);
  return val ?? undefined;
}

export async function setCachedPetPhoto(externalId: string, photoUri: string): Promise<void> {
  await AsyncStorage.setItem(`pet-care:api:pet-photo:${externalId}`, photoUri);
}
