import * as ImageManipulator from 'expo-image-manipulator';
import { Image as RNImage, Platform } from 'react-native';

export type ImageUploadStatus =
  | 'idle'
  | 'preparing'
  | 'compressing'
  | 'uploading'
  | 'saving'
  | 'success'
  | 'failed';

export interface ImageUploadState {
  status: ImageUploadStatus;
  progress?: number;
  message?: string;
  errorMessage?: string;
}

export interface PreparedImage {
  uri: string;
  base64?: string;
}

export function getImageUploadMessage(status: ImageUploadStatus): string {
  switch (status) {
    case 'preparing':
      return '사진을 준비 중이에요';
    case 'compressing':
      return '사진을 준비 중이에요';
    case 'uploading':
      return '사진을 업로드 중이에요';
    case 'saving':
      return '저장 중이에요';
    case 'success':
      return '저장되었습니다';
    case 'failed':
      return '업로드에 실패했어요';
    case 'idle':
    default:
      return '';
  }
}

export async function prepareImageForUpload(
  uri: string,
  options: {
    maxWidth: number;
    compress: number;
    base64?: boolean;
  },
): Promise<PreparedImage> {
  const size = await getImageSize(uri);
  const actions = size.width > options.maxWidth
    ? [{ resize: { width: options.maxWidth } }]
    : [];
  const result = await ImageManipulator.manipulateAsync(
    uri,
    actions,
    {
      compress: options.compress,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: options.base64,
    },
  );

  return {
    uri: result.uri,
    base64: result.base64,
  };
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  const fallback = { width: Number.MAX_SAFE_INTEGER, height: Number.MAX_SAFE_INTEGER };
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      const img = new window.Image();
      const timer = setTimeout(() => resolve(fallback), 5000);
      img.onload = () => { clearTimeout(timer); resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
      img.onerror = () => { clearTimeout(timer); resolve(fallback); };
      img.src = uri;
      return;
    }
    RNImage.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => resolve(fallback),
    );
  });
}

export function toBase64DataUri(image: PreparedImage): string {
  if (image.uri.startsWith('data:image/')) return image.uri;
  if (!image.base64) throw new Error('base64 변환 결과가 없어요.');
  return `data:image/jpeg;base64,${image.base64}`;
}
