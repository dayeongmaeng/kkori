import {
  getCachedCurrentCaregiverId,
  setCachedCurrentCaregiverId,
} from '../cache/caregiver';
import { logger } from '../logger';
import { caregiverApi } from './caregiver';

/**
 * 앱 시작 시 1회 호출 (initDeviceId 이후).
 * 서버에서 보호자 목록을 가져와 OWNER를 캐시에 저장한다.
 * 없으면 "나 / OWNER"로 자동 등록한다.
 */
export async function initCaregiver(): Promise<void> {
  const cached = await getCachedCurrentCaregiverId();
  if (cached) {
    logger.debug('caregiver.init.cache.hit', { caregiverId: cached });
    return;
  }

  logger.debug('caregiver.init.fetch.start');
  const caregivers = await caregiverApi.getCaregivers();
  logger.debug('caregiver.init.fetch.success', { count: caregivers.length });

  const owner =
    caregivers.find((c) => c.role === 'OWNER') ?? caregivers[0] ?? null;

  if (owner) {
    await setCachedCurrentCaregiverId(owner.externalId);
    logger.debug('caregiver.init.cache.saved', { caregiverId: owner.externalId });
    return;
  }

  logger.debug('caregiver.init.create.start');
  const created = await caregiverApi.createCaregiver({ name: '나', role: 'OWNER', color: '#191F28' });
  await setCachedCurrentCaregiverId(created.externalId);
  logger.debug('caregiver.init.create.success', { caregiverId: created.externalId });
}
