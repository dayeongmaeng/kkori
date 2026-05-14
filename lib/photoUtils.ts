import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const MAX_SIZE = 800;
const JPEG_QUALITY = 0.7;

// 웹 전용: blob URL → canvas 리사이즈 → base64 data URL
function compressOnWeb(uri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, MAX_SIZE / Math.max(w, h));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('canvas 초기화 실패'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };

    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = uri;
  });
}

export async function base64ToTempFile(base64: string, filename = 'photo.jpg'): Promise<string> {
  if (Platform.OS === 'web') {
    // 웹은 파일 시스템 없음 — base64 그대로 반환 (a 태그 download에 직접 사용)
    return base64;
  }

  // 이미 file:// URI면 그대로 반환
  if (base64.startsWith('file://')) {
    return base64;
  }

  // "data:image/jpeg;base64,XXX" 에서 순수 base64 부분만 추출
  const raw = base64.includes(',') ? base64.split(',')[1] : base64;
  const destUri = FileSystem.cacheDirectory + filename;

  await FileSystem.writeAsStringAsync(destUri, raw, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return destUri;
}

export async function uriToBase64(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    return compressOnWeb(uri);
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/jpeg;base64,${base64}`;
}
