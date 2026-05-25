import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

// EXPO_PUBLIC_* 변수는 Metro 번들러가 빌드 타임에 리터럴로 치환한다.
// Vercel에서는 expo export 실행 시점에 환경변수가 주입되어야 한다.
// 런타임에 process.env로 동적으로 읽는 것이 아니므로, 배포 후에는 재빌드 없이 값을 바꿀 수 없다.
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

function getGoogleRedirectUri() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/oauth/google`;
  }

  if (Platform.OS === 'ios' && GOOGLE_IOS_CLIENT_ID) {
    const reversed = GOOGLE_IOS_CLIENT_ID.split('.').reverse().join('.');
    return AuthSession.makeRedirectUri({ native: `${reversed}:/` });
  }

  return AuthSession.makeRedirectUri({
    scheme: 'kkori',
    path: 'oauth/google',
  });
}

export function maskClientId(clientId?: string) {
  if (!clientId) return 'missing';
  return `${clientId.slice(0, 12)}...${clientId.slice(-12)}`;
}

// 디버그용: 앞/뒤 4자만 노출하는 안전 마스크
function debugMask(value: string | undefined): string {
  if (!value) return '(missing)';
  const len = value.length;
  if (len <= 8) return `(${len}chars)`;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function getGoogleClientId(): string {
  if (Platform.OS === 'ios') return GOOGLE_IOS_CLIENT_ID ?? '';
  if (Platform.OS === 'android') return GOOGLE_ANDROID_CLIENT_ID ?? '';
  return GOOGLE_WEB_CLIENT_ID ?? '';
}

/** Google 로그인 초기화 시점 진단 로그. 민감 정보(token 류)는 출력하지 않는다. */
export function logGoogleAuthDiagnostics(): void {
  const platform = Platform.OS;
  const isDev = __DEV__;
  const hostname =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.hostname
      : 'native';

  const envEntries = [
    { varName: 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', value: GOOGLE_WEB_CLIENT_ID },
    { varName: 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', value: GOOGLE_IOS_CLIENT_ID },
    { varName: 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID', value: GOOGLE_ANDROID_CLIENT_ID },
  ];

  console.info('[GoogleAuth] diagnostics', {
    platform,
    hostname,
    isDev,
    redirectUri: GOOGLE_REDIRECT_URI,
    envVars: envEntries.map(e => ({
      varName: e.varName,
      exists: Boolean(e.value),
      length: e.value?.length ?? 0,
      masked: debugMask(e.value),
    })),
  });

  // 현재 플랫폼에서 실제로 선택되는 client ID 추적
  let selectedVar: string;
  let selectedValue: string | undefined;
  if (platform === 'ios') {
    selectedVar = 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID';
    selectedValue = GOOGLE_IOS_CLIENT_ID;
  } else if (platform === 'android') {
    selectedVar = 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID';
    selectedValue = GOOGLE_ANDROID_CLIENT_ID;
  } else {
    selectedVar = 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID';
    selectedValue = GOOGLE_WEB_CLIENT_ID;
  }

  console.info('[GoogleAuth] selected client ID for platform', {
    platform,
    varName: selectedVar,
    exists: Boolean(selectedValue),
    length: selectedValue?.length ?? 0,
    masked: debugMask(selectedValue),
  });
}

export const GOOGLE_REDIRECT_URI = getGoogleRedirectUri();
