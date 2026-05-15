import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';
import { getCurrentPetId, getPet } from '../lib/storage';
import { subscribePetName } from '../lib/petNameEvents';

const logoSource = require('../assets/logo.png');

function Logo() {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <Text style={styles.logoText}>꼬리</Text>;
  }
  return (
    <Image
      source={logoSource}
      style={styles.logoImage}
      contentFit="contain"
      onError={() => setFailed(true)}
    />
  );
}

export default function AppHeader() {
  const insets = useSafeAreaInsets();
  const [petName, setPetName] = useState<string | null>(null);

  const loadPetName = useCallback(async () => {
    const petId = await getCurrentPetId();
    if (!petId) { setPetName(null); return; }
    const pet = await getPet(petId);
    setPetName(pet?.name ?? null);
  }, []);

  useEffect(() => {
    loadPetName();
    return subscribePetName(loadPetName);
  }, [loadPetName]);

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

      <View style={styles.center} />

      {/* 우측: 로고 */}
      <View style={styles.logoArea}>
        <Logo />
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
