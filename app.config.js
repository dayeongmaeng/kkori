const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const reversedIosClientId = iosClientId
  ? iosClientId.split('.').reverse().join('.')
  : undefined;

const kakaoNativeAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;
// kakao{NATIVE_APP_KEY} 형식의 URL scheme — Kakao 앱이 인증 후 이 scheme으로 리다이렉트한다.
const kakaoUrlScheme = kakaoNativeAppKey ? `kakao${kakaoNativeAppKey}` : undefined;

/** @param {{ config: import('@expo/config').ExpoConfig }} ctx */
module.exports = ({ config }) => {
  const cfBundleUrlTypes = [...(config.ios?.infoPlist?.CFBundleURLTypes ?? [])];
  const lsApplicationQueriesSchemes = [
    ...(config.ios?.infoPlist?.LSApplicationQueriesSchemes ?? []),
  ];

  if (reversedIosClientId) {
    cfBundleUrlTypes.push({ CFBundleURLSchemes: [reversedIosClientId] });
  }

  if (kakaoUrlScheme) {
    cfBundleUrlTypes.push({ CFBundleURLSchemes: [kakaoUrlScheme] });
    // kakaokompassauth: Kakao 앱 설치 여부 확인용 (Linking.canOpenURL)
    // kakaolink: KakaoLink 앱 scheme
    lsApplicationQueriesSchemes.push('kakaokompassauth', 'kakaolink');
  }

  if (cfBundleUrlTypes.length === 0 && lsApplicationQueriesSchemes.length === 0) {
    return config;
  }

  return {
    ...config,
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
        ...(cfBundleUrlTypes.length > 0 ? { CFBundleURLTypes: cfBundleUrlTypes } : {}),
        ...(lsApplicationQueriesSchemes.length > 0
          ? { LSApplicationQueriesSchemes: lsApplicationQueriesSchemes }
          : {}),
      },
    },
  };
};
