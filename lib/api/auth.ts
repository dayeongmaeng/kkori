import { saveAuthTokens, StoredAuthTokens } from '../auth/tokenStorage';
import { getStoredDeviceId, initDeviceId } from './deviceId';
import { api } from './client';

export type OAuthProvider = 'GOOGLE' | 'KAKAO';

export interface OAuthLoginRequest {
  provider: OAuthProvider;
  idToken?: string;
  accessToken?: string;
  deviceExternalId: string;
}

export type AuthLoginResponse = StoredAuthTokens;

export async function loginWithOAuth(
  provider: OAuthProvider,
  token: { idToken?: string; accessToken?: string },
): Promise<AuthLoginResponse> {
  let deviceExternalId = await getStoredDeviceId();
  if (!deviceExternalId) {
    await initDeviceId();
    deviceExternalId = await getStoredDeviceId();
  }
  if (!deviceExternalId) {
    throw new Error('기기 정보를 찾을 수 없어요. 앱을 다시 실행한 뒤 시도해 주세요.');
  }

  const result = await api.post<AuthLoginResponse>(
    '/api/v1/auth/oauth/login',
    {
      provider,
      idToken: token.idToken,
      accessToken: token.accessToken,
      deviceExternalId,
    } satisfies OAuthLoginRequest,
    false,
    true,
  );

  await saveAuthTokens(result);
  return result;
}
