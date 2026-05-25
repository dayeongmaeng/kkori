const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const reversedIosClientId = iosClientId
  ? iosClientId.split('.').reverse().join('.')
  : undefined;

const kakaoNativeAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;
// kakao{NATIVE_APP_KEY} 형식의 URL scheme — Kakao 앱이 인증 후 이 scheme으로 리다이렉트한다.
const kakaoUrlScheme = kakaoNativeAppKey ? `kakao${kakaoNativeAppKey}` : undefined;

// IMPORTANT: 이 파일 변경 후에는 반드시 아래 명령을 실행해야 Info.plist에 반영된다.
//   npx expo prebuild --platform ios
// CFBundleURLTypes(kakao{NATIVE_APP_KEY}), LSApplicationQueriesSchemes(kakaokompassauth, kakaolink)가
// 자동 생성되므로, Xcode에서 ios/ 디렉터리를 새로 열거나 EAS Build를 새로 실행해야 한다.

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
