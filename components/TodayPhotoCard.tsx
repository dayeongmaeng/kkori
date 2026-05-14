import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DailyPhoto } from '../lib/types';

interface Props {
  todayPhoto?: DailyPhoto;
  onTapCamera: () => void;
  onTapGallery: () => void;
  onTapPhoto: () => void;
  aspectRatio?: number;
}

export default function TodayPhotoCard({
  todayPhoto,
  onTapCamera,
  onTapGallery,
  onTapPhoto,
  aspectRatio = 1,
}: Props) {
  if (!todayPhoto) {
    return (
      <TouchableOpacity
        style={[styles.emptyCard, { aspectRatio }]}
        onPress={onTapCamera}
        activeOpacity={0.85}
      >
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={onTapGallery}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="images-outline" size={18} color="#E8985C" />
        </TouchableOpacity>
        <View style={styles.emptyCenter}>
          <Text style={styles.cameraEmoji}>📷</Text>
          <Text style={styles.emptyText}>오늘의 한 컷을 남겨주세요</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.photoCard, { aspectRatio }]}
      onPress={onTapPhoto}
      activeOpacity={0.92}
    >
      <Image
        source={{ uri: todayPhoto.photoUri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#FFF4E8',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E8985C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCenter: {
    alignItems: 'center',
    gap: 8,
  },
  cameraEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
  },
  photoCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E0D6C8',
  },
});
