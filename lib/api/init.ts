import { initDeviceId } from './deviceId';

/**
 * 앱 시작 시 순서대로 실행:
 * 1. 디바이스 등록 (X-Device-Id 확보)
 * 2. 로그인 후 사용자 데이터는 AuthContext의 세션 동기화에서 복원
 */
export async function initApp(): Promise<void> {
  await initDeviceId();
}
