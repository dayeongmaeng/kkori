import { clearAuthSessionCache, saveAuthTokens, StoredAuthTokens } from '../auth/tokenStorage';
import { logger } from '../logger';
import { getStoredDeviceId, initDeviceId } from './deviceId';
import { api } from './client';

export type OAuthProvider = 'GOOGLE' | 'KAKAO';

export interface OAuthLoginRequest {
  provider: OAuthProvider;
  idToken?: string;
  accessToken?: string;
  code?: string;
  redirectUri?: string;
  deviceExternalId: string;
  googleOAuthAccessToken?: string;
  googleRefreshToken?: string;
}

export type AuthLoginResponse = StoredAuthTokens;

export interface LogoutRequest {
  deviceExternalId?: string;
}

export async function loginWithOAuth(
  provider: OAuthProvider,
  token: {
    idToken?: string;
    accessToken?: string;
    code?: string;
    redirectUri?: string;
    googleOAuthAccessToken?: string;
    googleRefreshToken?: string;
  },
): Promise<AuthLoginResponse> {
  let deviceExternalId = await getStoredDeviceId();
  if (!deviceExternalId) {
    await initDeviceId();
    deviceExternalId = await getStoredDeviceId();
  }
  if (!deviceExternalId) {
    throw new Error('기기 정보를 찾을 수 없어요. 앱을 다시 실행한 뒤 시도해 주세요.');
  }

  if (provider === 'GOOGLE') {
    logger.debug('auth.oauth.google.payload', {
      hasOAuthToken: Boolean(token.googleOAuthAccessToken),
      hasRefreshToken: Boolean(token.googleRefreshToken),
    });
  }

  const result = await api.post<AuthLoginResponse>(
    '/api/v1/auth/oauth/login',
    {
      provider,
      idToken: token.idToken,
      accessToken: token.accessToken,
      code: token.code,
      redirectUri: token.redirectUri,
      deviceExternalId,
      googleOAuthAccessToken: token.googleOAuthAccessToken,
      googleRefreshToken: token.googleRefreshToken,
    } satisfies OAuthLoginRequest,
    false,
    true,
  );

  await clearAuthSessionCache();
  await saveAuthTokens(result);
  logger.info('auth.oauth.login.success', {
    provider,
    userId: result.user?.externalId,
  });
  return result;
}

export async function logoutFromServer(): Promise<void> {
  const deviceExternalId = await getStoredDeviceId();
  await api.post<null>(
    '/api/v1/auth/logout',
    deviceExternalId ? ({ deviceExternalId } satisfies LogoutRequest) : {},
  );
}

export async function deleteAccount(): Promise<void> {
  await api.delete<null>('/api/v1/users/me');
}
