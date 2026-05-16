import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENT_CAREGIVER_ID_KEY = 'pet-care:api:current-caregiver-id';

export async function getCachedCurrentCaregiverId(): Promise<string | null> {
  return AsyncStorage.getItem(CURRENT_CAREGIVER_ID_KEY);
}

export async function setCachedCurrentCaregiverId(id: string): Promise<void> {
  await AsyncStorage.setItem(CURRENT_CAREGIVER_ID_KEY, id);
}
