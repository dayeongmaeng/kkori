import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { colors } from '../constants/theme';
import { getCurrentPetId, getPet } from '../lib/storage';

// 로고 이미지가 준비되면 아래 주석을 해제하고 텍스트 fallback 제거
// import { Image } from 'expo-image';
// const logoSource = require('../assets/logo.png'); // 여기에 로고 이미지 넣으면 자동 교체

const LOGO_IMAGE_READY = false; // logo.png 준비되면 true로 변경

export default function AppHeader() {
  const insets = useSafeAreaInsets();
  const [petName, setPetName] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      async function loadPetName() {
        const petId = await getCurrentPetId();
        if (!petId) { setPetName(null); return; }
        const pet = await getPet(petId);
        setPetName(pet?.name ?? null);
      }
      loadPetName();
    }, [])
  );

  function handlePetPress() {
    Alert.alert('반려동물 추가 기능은 곧 출시예정이에요 🐾');
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 좌측: 현재 펫 이름 + 드롭다운 화살표 */}
      <TouchableOpacity style={styles.petButton} onPress={handlePetPress} activeOpacity={0.7}>
        <Text style={styles.petName} numberOfLines={1}>
          {petName ?? '반려동물 등록'}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      {/* 가운데: 비워둠 */}
      <View style={styles.center} />

      {/* 우측: 로고 */}
      <View style={styles.logoArea}>
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
  petButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 160,
  },
  petName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  arrow: {
    fontSize: 9,
    color: colors.textTertiary,
    marginTop: 1,
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
