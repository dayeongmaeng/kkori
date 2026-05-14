import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, shadow, spacing } from '../constants/theme';
import { formatAge } from '../lib/dateUtils';
import { Pet } from '../lib/types';

interface Props {
  pet: Pet;
}

export default function HomeProfileCard({ pet }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.navigate('/profile')}
      activeOpacity={0.85}
    >
      <View style={styles.row}>
        {pet.photoUri ? (
          <Image source={{ uri: pet.photoUri }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarEmoji}>🐾</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name}>{pet.name}</Text>
          <Text style={styles.breed}>
            {pet.breed} · {formatAge(pet.birthDate)}
          </Text>
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
    ...Platform.select({
      ios: shadow.md,
      android: { elevation: shadow.md.elevation },
      default: {},
    }),
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
