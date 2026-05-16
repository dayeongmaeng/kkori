import AsyncStorage from '@react-native-async-storage/async-storage';

function key(externalId: string) {
  return `pet-care:photo-data:${externalId}`;
}

export async function savePhotoLocal(externalId: string, base64: string): Promise<void> {
  await AsyncStorage.setItem(key(externalId), base64);
}

export async function getPhotoLocal(externalId: string): Promise<string | undefined> {
  const val = await AsyncStorage.getItem(key(externalId));
  return val ?? undefined;
}

export async function deletePhotoLocal(externalId: string): Promise<void> {
  await AsyncStorage.removeItem(key(externalId));
}
