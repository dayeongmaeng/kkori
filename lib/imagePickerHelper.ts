import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { showAlert } from './dialog';
import { logger } from './logger';

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

function pickImageWebRaw(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // DOM에 없는 element는 일부 브라우저에서 click()이 무시됨
    input.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';
    document.body.appendChild(input);

    input.onchange = () => {
      if (document.body.contains(input)) document.body.removeChild(input);
      const file = input.files?.[0];
      if (!file) {
        logger.debug('image.picker.web.canceled');
        resolve(null);
        return;
      }
      logger.debug('image.picker.web.selected', { fileType: file.type });
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

async function pickImageNativeRaw(options: PickImageOptions): Promise<string | null> {
  logger.info('image.picker.permission.request');
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  logger.info('image.picker.permission.result', { status });

  if (status !== 'granted') {
    logger.warn('image.picker.permission.denied');
    showAlert('권한 필요', '사진 접근 권한이 필요합니다.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsMultipleSelection: false,
    allowsEditing: options.allowsEditing ?? false,
    ...(options.aspect ? { aspect: options.aspect } : {}),
    quality: 1,
  });
  if (result.canceled || !result.assets?.[0]) {
    logger.debug('image.picker.canceled');
    return null;
  }
  logger.debug('image.picker.selected');
  return result.assets[0].uri;
}

export async function pickImageUri(options: PickImageOptions = {}): Promise<string | null> {
  if (Platform.OS === 'web') {
    return pickImageWebRaw();
  }
  return pickImageNativeRaw(options);
}

export async function pickImage(options: PickImageOptions = {}): Promise<string | null> {
  const uri = await pickImageUri(options);
  if (!uri) return null;
  try {
    return await resizeImage(uri);
  } catch {
    return null;
  }
}
