import { initCaregiver } from './initCaregiver';
import { initDeviceId } from './deviceId';

/**
 * 앱 시작 시 순서대로 실행:
 * 1. 디바이스 등록 (X-Device-Id 확보)
 * 2. 보호자 등록/조회 (caregiverExternalId 확보)
 */
export async function initApp(): Promise<void> {
  await initDeviceId();
  await initCaregiver();
}
