import {
  getCachedCurrentCaregiverId,
  setCachedCurrentCaregiverId,
} from '../cache/caregiver';
import { caregiverApi } from './caregiver';

/**
 * 앱 시작 시 1회 호출 (initDeviceId 이후).
 * 서버에서 보호자 목록을 가져와 OWNER를 캐시에 저장한다.
 * 없으면 "나 / OWNER"로 자동 등록한다.
 */
export async function initCaregiver(): Promise<void> {
  const cached = await getCachedCurrentCaregiverId();
  if (cached) {
    console.log('[initCaregiver] 캐시 hit:', cached);
    return;
  }

  console.log('[initCaregiver] 서버에서 보호자 조회 중...');
  const caregivers = await caregiverApi.getCaregivers();
  console.log('[initCaregiver] 서버 응답 수:', caregivers.length, caregivers);

  const owner =
    caregivers.find((c) => c.role === 'OWNER') ?? caregivers[0] ?? null;

  if (owner) {
    await setCachedCurrentCaregiverId(owner.externalId);
    console.log('[initCaregiver] OWNER 캐시 저장:', owner.externalId);
    return;
  }

  console.log('[initCaregiver] 보호자 없음 → 자동 생성');
  const created = await caregiverApi.createCaregiver({ name: '나', role: 'OWNER', color: '#191F28' });
  await setCachedCurrentCaregiverId(created.externalId);
  console.log('[initCaregiver] 생성 완료:', created.externalId);
}
