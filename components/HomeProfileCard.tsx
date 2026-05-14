import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { daysSince, formatAge } from '../lib/dateUtils';
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
          <Text style={styles.since}>함께한 지 {daysSince(pet.createdAt)}일</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0D6C8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3D2C1E',
  },
  breed: {
    fontSize: 14,
    color: '#666666',
  },
  since: {
    fontSize: 13,
    color: '#999999',
  },
});
