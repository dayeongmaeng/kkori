import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Platform, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../constants/theme';

const cardShadow: ViewStyle = Platform.select<ViewStyle>({
  ios: {
    shadowColor: shadow.md.shadowColor,
    shadowOffset: shadow.md.shadowOffset,
    shadowOpacity: shadow.md.shadowOpacity,
    shadowRadius: shadow.md.shadowRadius,
  },
  android: { elevation: shadow.md.elevation },
  default: {},
}) ?? {};
import { formatAge, formatTogetherness } from '../lib/dateUtils';
import { PetResponse } from '../lib/api/pet';

interface Props {
  pet: PetResponse;
}

export default function HomeProfileCard({ pet }: Props) {
  const dateLabel = (() => {
    if (pet.birthDate && !pet.birthDateUnknown) return formatAge(pet.birthDate);
    if (pet.adoptionDate) return formatTogetherness(pet.adoptionDate);
    return '생일이나 함께한 날을 입력해보세요';
  })();
  const breedAge = [pet.breed, dateLabel].filter(Boolean).join(' · ');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.navigate('/profile')}
      activeOpacity={0.85}
    >
      <View style={styles.row}>
        {pet.photoBase64 ? (
          <Image source={{ uri: pet.photoBase64 }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarEmoji}>🐾</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name}>{pet.name}</Text>
          {breedAge ? <Text style={styles.breed}>{breedAge}</Text> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    ...cardShadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  breed: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
