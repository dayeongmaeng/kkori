import { pickImage } from '../../lib/imagePickerHelper';
import { generateThumbnails } from '../../lib/photoUtils';
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
import { photoApi } from '../../lib/api/photo';
import {
  getCachedPhotos,
  LocalPhoto,
  mergeWithLocal,
  setCachedPhotos,
  upsertCachedPhoto,
} from '../../lib/cache/photo';
import { getCachedCurrentPetId } from '../../lib/cache/pet';
import { getCachedCurrentCaregiverId } from '../../lib/cache/caregiver';
import { initCaregiver } from '../../lib/api/initCaregiver';
import { savePhotoLocal } from '../../lib/photoLocalCache';
import { colors, radius, shadow, spacing } from '../../constants/theme';
import { useDate } from '../../contexts/DateContext';

const CELL_SIZE = Math.floor(Dimensions.get('window').width / 3);

function PhotoCell({ photo, onPress }: { photo: LocalPhoto; onPress: () => void }) {
  const uri = photo.thumbnailUrl ?? photo.photoUri;
  if (!uri) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View style={[styles.cell, styles.cellNoLocal]}>
          <Text style={styles.cellNoLocalIcon}>📲</Text>
          {photo.edited && (
            <View style={styles.editedBadge}>
              <Text style={styles.editedBadgeText}>수정됨</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri }} style={styles.cell} contentFit="cover" />
      {photo.edited && (
        <View style={styles.editedBadge}>
          <Text style={styles.editedBadgeText}>수정됨</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function formatDateKorean(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

export default function PhotoScreen() {
  const [hasPet, setHasPet] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingBase64, setPendingBase64] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const today = useDate();
  const todayPhoto = photos.find((p) => p.date === today);
  const pastPhotos = photos.filter((p) => p.date !== today);

  const load = useCallback(async () => {
    const petId = await getCachedCurrentPetId();
    if (!petId) { setHasPet(false); return; }
    setHasPet(true);

    // 1단계: 캐시에서 즉시 표시
    const cached = await getCachedPhotos(petId);
    setPhotos(await mergeWithLocal(cached));

    // 2단계: 서버에서 갱신 (백그라운드)
    try {
      const serverPhotos = await photoApi.getPhotos(petId);
      console.log('[PhotoLoad] 서버 응답 원형:', JSON.stringify(serverPhotos)?.slice(0, 300));
      await setCachedPhotos(petId, serverPhotos);
      setPhotos(await mergeWithLocal(serverPhotos));
    } catch (e) {
      console.warn('[PhotoLoad] 서버 fetch 실패:', e);
      // 오프라인 — 캐시 유지
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useFocusEffect(useCallback(() => {
    async function loadOnFocus() {
      const petId = await getCachedCurrentPetId();
      if (!petId) { setHasPet(false); return; }
      setHasPet(true);
      try {
        const serverPhotos = await photoApi.getPhotos(petId);
        await setCachedPhotos(petId, serverPhotos);
        setPhotos(await mergeWithLocal(serverPhotos));
      } catch {
        const cached = await getCachedPhotos(petId);
        setPhotos(await mergeWithLocal(cached));
      }
    }
    loadOnFocus();
  }, []));

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });
    return () => sub.remove();
  }, [load]);

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
    const petId = await getCachedCurrentPetId();
    if (!petId) {
      Alert.alert('알림', '프로필 탭에서 반려동물을 먼저 등록해주세요.');
      return;
    }
    const dataUri = await pickImage({ allowsEditing: true, aspect: [1, 1] });
    if (!dataUri) return;
    handlePhotoTaken(dataUri);
  }

  function handleTapTodayPhoto() {
    if (todayPhoto) router.push(`/photo/${todayPhoto.externalId}`);
  }

  async function handleSavePhoto(caption: string) {
    setModalVisible(false);
    const petId = await getCachedCurrentPetId();
    if (!petId || !pendingBase64) return;

    const localBase64 = pendingBase64;
    setPendingBase64(null);

    try {
      // takenAt의 날짜 부분을 today(KST)로 고정하여 그리드 분류 일치
      const timeStr = new Date().toISOString().split('T')[1];
      const takenAt = `${today}T${timeStr}`;

      let caregiverId = await getCachedCurrentCaregiverId();
      console.log('[PhotoSave] caregiverId (캐시):', caregiverId);

      if (!caregiverId) {
        console.warn('[PhotoSave] caregiverId 없음 — initCaregiver 재시도');
        await initCaregiver();
        caregiverId = await getCachedCurrentCaregiverId();
        console.log('[PhotoSave] caregiverId (재시도 후):', caregiverId);
      }

      const response = await photoApi.createPhoto({
        petExternalId: petId,
        caregiverExternalId: caregiverId ?? undefined,
        date: today,
        takenAt,
        caption: caption || undefined,
      });
      console.log('[PhotoSave] 메타 생성:', response.externalId);

      // 원본 base64 로컬 저장 (월력용) + 즉시 표시
      await savePhotoLocal(response.externalId, localBase64);
      await upsertCachedPhoto(petId, response);
      await load();

      // S3 업로드 (실패해도 메타데이터는 유지)
      try {
        const { medium, thumbnail } = await generateThumbnails(localBase64);
        const uploadResponse = await photoApi.uploadPhoto(response.externalId, medium, thumbnail);
        console.log('[PhotoSave] S3 업로드 완료:', uploadResponse.mediumUrl);
        await upsertCachedPhoto(petId, { ...response, ...uploadResponse });
        await load();
      } catch (uploadErr) {
        console.warn('[PhotoSave] S3 업로드 실패 (메타 유지):', uploadErr);
      }
    } catch {
      Alert.alert('오류', '서버에 저장하지 못했어요. 다시 시도해주세요.');
    }
  }

  function handleCancelModal() {
    setModalVisible(false);
    setPendingBase64(null);
  }

  const listHeader = (
    <View>
      <View style={styles.headerBannerCol}>
        <View style={styles.headerBannerRow}>
          <View>
            <Text style={styles.headerTitle}>하루 한 장</Text>
            <Text style={styles.todayText}>{formatDateKorean(today)}</Text>
          </View>
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
        keyExtractor={(item) => item.externalId}
        numColumns={3}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        renderItem={({ item }) => (
          <PhotoCell photo={item} onPress={() => router.push(`/photo/${item.externalId}`)} />
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
  todayText: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
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
  editedBadge: {
    position: 'absolute',
    left: spacing.xs,
    bottom: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: 'rgba(25,31,40,0.68)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  editedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  cellNoLocal: {
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellNoLocalIcon: {
    fontSize: 24,
  },
});
