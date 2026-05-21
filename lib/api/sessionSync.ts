import { setCachedCurrentCaregiverId } from '../cache/caregiver';
import { setCachedLogs } from '../cache/log';
import { setCachedPhotos } from '../cache/photo';
import {
  getCachedCurrentPetId,
  setCachedCurrentPetId,
  setCachedPets,
} from '../cache/pet';
import { caregiverApi } from './caregiver';
import { initDeviceId } from './deviceId';
import { logApi } from './log';
import { petApi, PetResponse } from './pet';
import { photoApi } from './photo';

async function syncCaregiver() {
  const caregivers = await caregiverApi.getCaregivers();
  const owner = caregivers.find((c) => c.role === 'OWNER') ?? caregivers[0] ?? null;
  if (owner) {
    await setCachedCurrentCaregiverId(owner.externalId);
  }
}

async function selectCurrentPet(pets: PetResponse[]): Promise<PetResponse | null> {
  await setCachedPets(pets);

  if (pets.length === 0) return null;

  const cachedPetId = await getCachedCurrentPetId();
  const selectedPet = pets.find((pet) => pet.externalId === cachedPetId) ?? pets[0];
  await setCachedCurrentPetId(selectedPet.externalId);
  return selectedPet;
}

async function syncPetChildren(petExternalId: string) {
  const [logsResult, photosResult] = await Promise.allSettled([
    logApi.getLogs({ petExternalId }),
    photoApi.getPhotos(petExternalId),
  ]);

  if (logsResult.status === 'fulfilled') {
    await setCachedLogs(petExternalId, logsResult.value);
  } else {
    console.warn('[SessionSync] logs fetch failed:', logsResult.reason);
  }

  if (photosResult.status === 'fulfilled') {
    await setCachedPhotos(petExternalId, photosResult.value);
  } else {
    console.warn('[SessionSync] photos fetch failed:', photosResult.reason);
  }
}

export async function syncServerSessionData(): Promise<void> {
  await initDeviceId();

  try {
    await syncCaregiver();
  } catch (error) {
    console.warn('[SessionSync] caregiver fetch failed:', error);
  }

  const pets = await petApi.getPets();
  const selectedPet = await selectCurrentPet(pets);
  if (!selectedPet) return;

  await Promise.all(pets.map((pet) => syncPetChildren(pet.externalId)));
  console.log('[SessionSync] server data synced', {
    petCount: pets.length,
    currentPetId: selectedPet.externalId,
  });
}
