import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export interface PickImageOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}

function pickImageWeb(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

async function pickImageNative(options: PickImageOptions): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('권한 필요', '사진 접근 권한이 필요합니다.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: options.allowsEditing ?? true,
    ...(options.aspect ? { aspect: options.aspect } : {}),
    quality: options.quality ?? 0.7,
    base64: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const b64 = result.assets[0].base64;
  if (!b64) return null;
  return `data:image/jpeg;base64,${b64}`;
}

export async function pickImage(options: PickImageOptions = {}): Promise<string | null> {
  if (Platform.OS === 'web') {
    return pickImageWeb();
  }
  return pickImageNative(options);
}
