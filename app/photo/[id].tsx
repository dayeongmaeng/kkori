import { router, useLocalSearchParams } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import PhotoActionSheet from '../../components/PhotoActionSheet';
import { base64ToTempFile } from '../../lib/photoUtils';
import { deleteDailyPhoto, getDailyPhotoById } from '../../lib/storage';
import { DailyPhoto } from '../../lib/types';
import { colors, radius, spacing } from '../../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

function formatDateKorean(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

export default function PhotoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [photo, setPhoto] = useState<DailyPhoto | null | 'loading'>('loading');
  const [actionSheetVisible, setActionSheetVisible] = useState(false);

  useEffect(() => {
    async function loadPhoto() {
      const found = await getDailyPhotoById(id);
      setPhoto(found);
    }
    loadPhoto();
  }, [id]);

  async function handleShare() {
    setActionSheetVisible(false);
    if (photo === 'loading' || photo === null) return;
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({ title: '오늘의 사진', text: photo.caption ?? '' });
        } else {
          Alert.alert('알림', '이 브라우저에서는 공유가 지원되지 않아요.');
        }
        return;
      }
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('알림', '이 기기에서는 공유 기능을 사용할 수 없어요.');
        return;
      }
      const tempUri = await base64ToTempFile(photo.photoUri, `photo_${photo.id}.jpg`);
      await Sharing.shareAsync(tempUri, { dialogTitle: '오늘의 사진 공유하기' });
    } catch {
      Alert.alert('오류', '공유 중 문제가 발생했어요.');
    }
  }

  async function handleSaveToAlbum() {
    setActionSheetVisible(false);
    if (photo === 'loading' || photo === null) return;
    try {
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = photo.photoUri;
        link.download = `photo_${photo.date}.jpg`;
        link.click();
        return;
      }
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진을 저장하려면 사진첩 접근 권한이 필요해요.');
        return;
      }
      const tempUri = await base64ToTempFile(photo.photoUri, `photo_${photo.id}.jpg`);
      await MediaLibrary.saveToLibraryAsync(tempUri);
      Alert.alert('완료', '사진첩에 저장됐어요 🐾');
    } catch {
      Alert.alert('오류', '저장 중 문제가 발생했어요.');
    }
  }

  async function confirmDelete() {
    if (photo === 'loading' || photo === null) return;
    try {
      await deleteDailyPhoto(id);
      router.back();
    } catch {
      Alert.alert('오류', '삭제에 실패했어요. 다시 시도해주세요.');
    }
  }

  function handleDelete() {
    setActionSheetVisible(false);
    setTimeout(() => {
      if (Platform.OS === 'web') {
        if (window.confirm('이 사진을 삭제할까요?\n같은 날짜에 다시 추가할 수 있어요.')) {
          confirmDelete();
        }
        return;
      }
      Alert.alert(
        '삭제하시겠어요?',
        '이 사진을 삭제할까요?\n같은 날짜에 다시 추가할 수 있어요.',
        [
          { text: '취소', style: 'cancel' },
          { text: '삭제', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }, 300);
  }

  // 로딩 중
  if (photo === 'loading') {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // 사진을 찾을 수 없음
  if (photo === null) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.notFoundEmoji}>🔍</Text>
        <Text style={styles.notFoundText}>사진을 찾을 수 없어요</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← 돌아가기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Text style={styles.headerBtnText}>← 뒤로</Text>
        </TouchableOpacity>

        <Text style={styles.headerDate}>{formatDateKorean(photo.date)}</Text>

        <TouchableOpacity style={styles.headerBtn} onPress={() => setActionSheetVisible(true)}>
          <Text style={styles.headerBtnText}>•••</Text>
        </TouchableOpacity>
      </View>

      {/* 사진 */}
      <Image
        source={{ uri: photo.photoUri }}
        style={styles.photo}
        contentFit="cover"
      />

      {/* 캡션 */}
      <View style={styles.captionSection}>
        {photo.caption ? (
          <Text style={styles.caption}>{photo.caption}</Text>
        ) : (
          <Text style={styles.captionEmpty}>캡션이 없어요</Text>
        )}
      </View>

      <PhotoActionSheet
        visible={actionSheetVisible}
        onClose={() => setActionSheetVisible(false)}
        onShare={handleShare}
        onSaveToAlbum={handleSaveToAlbum}
        onDelete={handleDelete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  headerDate: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  photo: {
    width: SCREEN_WIDTH,
    aspectRatio: 1,
  },
  captionSection: {
    padding: spacing.lg,
  },
  caption: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  captionEmpty: {
    fontSize: 15,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  notFoundEmoji: {
    fontSize: 48,
  },
  notFoundText: {
    fontSize: 16,
    color: colors.textTertiary,
  },
  backButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  backButtonText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
});
