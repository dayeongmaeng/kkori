import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';

// 로고 이미지가 준비되면 아래 주석을 해제하고 텍스트 fallback 제거
// import { Image } from 'expo-image';
// const logoSource = require('../assets/logo.png'); // 여기에 로고 이미지 넣으면 자동 교체

const LOGO_IMAGE_READY = false; // logo.png 준비되면 true로 변경

export default function AppHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 좌측: 나중에 메뉴/뒤로가기 버튼 영역 */}
      <View style={styles.side} />

      {/* 가운데: 비워둠 */}
      <View style={styles.center} />

      {/* 우측: 로고 */}
      <View style={[styles.side, styles.logoArea]}>
        {LOGO_IMAGE_READY ? (
          // <Image source={logoSource} style={styles.logoImage} contentFit="contain" />
          null
        ) : (
          <Text style={styles.logoText}>꼬리</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  side: {
    width: 80,
  },
  center: {
    flex: 1,
  },
  logoArea: {
    alignItems: 'flex-end',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  logoImage: {
    width: 80,
    height: 24,
  },
});
