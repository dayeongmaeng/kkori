// KakaoTalk 인앱 브라우저 감지 및 외부 브라우저 이탈 유틸
// iOS: kakaotalk://web/openExternal?url= 스킴으로 Safari에서 재오픈
// Android: intent:// 스킴으로 외부 브라우저 요청

export function isKakaoTalkInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /KAKAOTALK/i.test(navigator.userAgent);
}

// KakaoTalk 인앱 브라우저에서 targetUrl을 외부 브라우저로 이탈시킨다.
// 리다이렉트를 시도하면 true를 반환한다.
export function escapeKakaoTalkInAppBrowser(targetUrl: string): boolean {
  if (typeof window === 'undefined') return false;
  if (!isKakaoTalkInAppBrowser()) return false;

  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  if (isIOS) {
    window.location.replace(
      `kakaotalk://web/openExternal?url=${encodeURIComponent(targetUrl)}`
    );
    return true;
  }

  // Android: intent:// 스킴으로 외부 브라우저(Chrome 등) 요청
  const urlWithoutScheme = targetUrl.replace(/^https?:\/\//, '');
  window.location.replace(
    `intent://${urlWithoutScheme}#Intent;scheme=https;action=android.intent.action.VIEW;end`
  );
  return true;
}
