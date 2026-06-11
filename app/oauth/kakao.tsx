import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { escapeKakaoTalkInAppBrowser } from '../../lib/utils/inAppBrowser';

const KAKAO_REDIRECT_URI_STORAGE_KEY = 'pet-care:kakao:redirect-uri';

export default function KakaoOAuthCallbackRoute() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');
    if (!code && !error) return;

    // KakaoTalk 인앱 브라우저 감지: 현재 URL을 외부 Safari에서 다시 열고 중단
    // iOS: kakaotalk://web/openExternal?url= / Android: intent:// fallback
    if (escapeKakaoTalkInAppBrowser(window.location.href)) return;

    try {
      const isWebLogin = Boolean(window.sessionStorage.getItem(KAKAO_REDIRECT_URI_STORAGE_KEY));
      if (isWebLogin) return;
    } catch {
      // 인앱 브라우저에서 sessionStorage 접근이 실패하면 네이티브 콜백으로 처리해요.
    }

    const deepLinkParams = new URLSearchParams();
    if (code) deepLinkParams.set('code', code);
    if (error) deepLinkParams.set('error', error);

    window.location.replace(`kkori://oauth/kakao?${deepLinkParams.toString()}`);
  }, []);

  if (Platform.OS === 'web') return null;

  return <Redirect href="/" />;
}
