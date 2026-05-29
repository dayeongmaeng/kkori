import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, platformShadow, radius, shadow, spacing } from '../constants/theme';
import { formatAge, formatTogetherness } from '../lib/dateUtils';
import { PetResponse } from '../lib/api/pet';

interface Props {
  pet: PetResponse;
}

export default function HomeProfileCard({ pet }: Props) {
  const dateLabel = (() => {
    if (pet.birthDate && !pet.birthDateUnknown) return formatAge(pet.birthDate);
    if (pet.adoptionDate) return formatTogetherness(pet.adoptionDate);
    return null;
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
    ...platformShadow(shadow.md),
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
