import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

const RESIZE_WIDTH = 800;
const COMPRESS_QUALITY = 0.6;

export interface PickImageOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
}

// URI(파일 경로 또는 data URI) → 리사이즈된 base64 data URI
export async function resizeImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: RESIZE_WIDTH } }],
    { compress: COMPRESS_QUALITY, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  if (!result.base64) throw new Error('리사이즈 실패');
  return `data:image/jpeg;base64,${result.base64}`;
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
      reader.onload = async () => {
        try {
          resolve(await resizeImage(reader.result as string));
        } catch {
          resolve(null);
        }
      };
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
    quality: 1,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  try {
    return await resizeImage(result.assets[0].uri);
  } catch {
    return null;
  }
}

export async function pickImage(options: PickImageOptions = {}): Promise<string | null> {
  if (Platform.OS === 'web') {
    return pickImageWeb();
  }
  return pickImageNative(options);
}
