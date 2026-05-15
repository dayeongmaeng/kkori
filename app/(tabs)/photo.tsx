import { pickImage } from '../../lib/imagePickerHelper';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  AppState,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import CaptionModal from '../../components/CaptionModal';
import EmptyPetState from '../../components/EmptyPetState';
import TodayPhotoCard from '../../components/TodayPhotoCard';
import {
  getCurrentPetId,
  getDailyPhotos,
  saveDailyPhoto,
} from '../../lib/storage';
import { colors, radius, shadow, spacing } from '../../constants/theme';
import { useMidnightRefresh } from '../../hooks/useMidnightRefresh';
import { DailyPhoto } from '../../lib/types';

const CELL_SIZE = Math.floor(Dimensions.get('window').width / 3);

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function PhotoCell({ photo, onPress }: { photo: DailyPhoto; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: photo.photoUri }} style={styles.cell} contentFit="cover" />
    </TouchableOpacity>
  );
}

export default function PhotoScreen() {
  const [hasPet, setHasPet] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<DailyPhoto[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingBase64, setPendingBase64] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const today = getTodayString();
  const todayPhoto = photos.find((p) => p.date === today);
  const pastPhotos = photos.filter((p) => p.date !== today);

  const load = useCallback(async () => {
    const petId = await getCurrentPetId();
    if (!petId) { setHasPet(false); return; }
    setHasPet(true);
    const loadedPhotos = await getDailyPhotos(petId);
    setPhotos(loadedPhotos);
  }, []);

  useEffect(() => { load(); }, [load]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });
    return () => sub.remove();
  }, [load]);

  useMidnightRefresh(load);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  function handlePhotoTaken(base64Uri: string) {
    setPendingBase64(base64Uri);
    setModalVisible(true);
  }

  async function handleOpenGallery() {
    const petId = await getCurrentPetId();
    if (!petId) {
      Alert.alert('알림', '프로필 탭에서 반려동물을 먼저 등록해주세요.');
      return;
    }

    const dataUri = await pickImage({ allowsEditing: true, aspect: [1, 1] });
    if (!dataUri) return;
    handlePhotoTaken(dataUri);
  }

  function handleTapTodayPhoto() {
    if (todayPhoto) router.push(`/photo/${todayPhoto.id}`);
  }

  async function handleSavePhoto(caption: string) {
    setModalVisible(false);
    const petId = await getCurrentPetId();
    if (!petId || !pendingBase64) return;

    const photo: DailyPhoto = {
      id: generateId(),
      petId,
      date: today,
      photoUri: pendingBase64,
      caption: caption || undefined,
      caregiverId: '',
      createdAt: new Date().toISOString(),
    };

    try {
      await saveDailyPhoto(photo);
      setPendingBase64(null);
      await load();
    } catch {
      Alert.alert('오류', '저장에 실패했어요. 다시 시도해주세요.');
    }
  }

  function handleCancelModal() {
    setModalVisible(false);
    setPendingBase64(null);
  }

  const listHeader = (
    <View>
      <View style={styles.headerBannerCol}>
        {/* 상단: 타이틀 + 월력 버튼 */}
        <View style={styles.headerBannerRow}>
          <Text style={styles.headerTitle}>하루 한 장</Text>
          <TouchableOpacity
            style={styles.calendarBtn}
            onPress={() => Alert.alert('곧 출시될 기능이에요 🐾', '조금만 기다려주세요')}
            activeOpacity={0.75}
          >
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonBadgeText}>출시 예정</Text>
            </View>
            <Text style={styles.calendarBtnText}>월력 만들기</Text>
          </TouchableOpacity>
        </View>

        {/* 하단 안내 배지 */}
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>오늘의 한 장이 오래도록 남아요.</Text>
        </View>
      </View>
      <View style={styles.headerSection}>
        <TodayPhotoCard
          todayPhoto={todayPhoto}
          onPhotoTaken={handlePhotoTaken}
          onTapGallery={handleOpenGallery}
          onTapPhoto={handleTapTodayPhoto}
        />
        {pastPhotos.length > 0 && (
          <Text style={styles.sectionLabel}>지난 사진</Text>
        )}
      </View>
    </View>
  );

  const listEmpty = (
    <View style={styles.emptyArea}>
      <Text style={styles.emptyText}>기록된 사진이 없습니다</Text>
    </View>
  );

  if (hasPet === false) {
    return (
      <View style={styles.container}>
        <EmptyPetState />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={pastPhotos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        renderItem={({ item }) => (
          <PhotoCell photo={item} onPress={() => router.push(`/photo/${item.id}`)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
        columnWrapperStyle={pastPhotos.length > 0 ? styles.row : undefined}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      />

      {pendingBase64 && (
        <CaptionModal
          visible={modalVisible}
          photoBase64={pendingBase64}
          onSave={handleSavePhoto}
          onCancel={handleCancelModal}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSection: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerBannerCol: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  headerBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 5,
    paddingHorizontal: 14,
    ...shadow.sm,
  },
  headerBadgeText: {
    fontSize: 12,
    color: colors.textOnPrimary,
  },
  calendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  comingSoonBadge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  comingSoonBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
  },
  sectionLabel: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  emptyArea: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  row: {
    gap: 2,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
});
