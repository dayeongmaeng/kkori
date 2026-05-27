import { pickImageUri } from '../../lib/imagePickerHelper';
import { logger, toLogError } from '../../lib/logger';
import { generateThumbnails } from '../../lib/photoUtils';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCurrentPet } from '../../contexts/PetContext';
import {
  ActivityIndicator,
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
import {
  ImageUploadState,
  prepareImageForUpload,
} from '../../lib/imageUpload';
import { colors, radius, shadow, spacing } from '../../constants/theme';
import { useDate } from '../../contexts/DateContext';

const CELL_SIZE = Math.floor(Dimensions.get('window').width / 3);

function PhotoCell({ photo, onPress }: { photo: LocalPhoto; onPress: () => void }) {
  const [imgError, setImgError] = useState(false);
  const uri = photo.thumbnailUrl ?? photo.photoUri;

  if (!uri || imgError) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View style={[styles.cell, styles.cellNoLocal]}>
          <Text style={styles.cellNoLocalIcon}>📲</Text>
        </View>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Image
        source={{ uri }}
        style={styles.cell}
        contentFit="cover"
        onError={() => {
          if (__DEV__) {
            let logUri = uri;
            if (!uri.startsWith('blob:') && !uri.startsWith('data:')) {
              try { const u = new URL(uri); logUri = u.origin + u.pathname; } catch {}
            } else {
              logUri = uri.slice(0, 50);
            }
            logger.warn('photo.cell.image.load_failed', { uri: logUri });
          }
          setImgError(true);
        }}
      />
    </TouchableOpacity>
  );
}

function formatDateKorean(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

export default function PhotoScreen() {
  const { currentPet } = useCurrentPet();
  const petIdFromContext = currentPet?.externalId ?? null;

  const [hasPet, setHasPet] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [uploadState, setUploadState] = useState<ImageUploadState>({ status: 'idle' });
  const [failedUpload, setFailedUpload] = useState<{
    sourceUri: string;
    preparedUri?: string;
    caption: string;
    externalId?: string;
    response?: LocalPhoto;
  } | null>(null);
  const uploadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const today = useDate();
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const todayPhoto = photos.find((p) => p.date === today);
  const pastPhotos = photos.filter((p) => p.date !== today);

  function debugPhotoUpload(step: string, payload?: unknown) {
    if (!__DEV__) return;
    const extra: Record<string, unknown> =
      payload === undefined ? {} :
      (typeof payload === 'object' && payload !== null)
        ? (payload as Record<string, unknown>)
        : { value: String(payload) };
    logger.debug('photo.tab.upload', { step, ...extra });
  }

  async function getDebugUriSize(uri: string): Promise<number | undefined> {
    if (!__DEV__) return undefined;
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return blob.size;
    } catch {
      return undefined;
    }
  }

  const load = useCallback(async () => {
    const petId = petIdFromContext;
    if (!petId) { setHasPet(false); return; }
    setHasPet(true);

    // 1단계: 캐시에서 즉시 표시
    const cached = await getCachedPhotos(petId);
    setPhotos(await mergeWithLocal(cached));

    // 2단계: 서버에서 갱신 (백그라운드)
    try {
      const serverPhotos = await photoApi.getPhotos(petId);
      logger.debug('photo.tab.load.server_response', { count: serverPhotos.length });
      await setCachedPhotos(petId, serverPhotos);
      setPhotos(await mergeWithLocal(serverPhotos));
    } catch (e) {
      logger.warn('photo.tab.load.server_failed', toLogError(e));
      // 오프라인 — 캐시 유지
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petIdFromContext]);

  useEffect(() => { load(); }, [load]);

  useFocusEffect(useCallback(() => {
    async function loadOnFocus() {
      const petId = petIdFromContext;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petIdFromContext]));

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });
    return () => sub.remove();
  }, [load]);

  // 반려동물 전환 시 이전 사진 즉시 클리어
  const isMountedRef = useRef(false);
  useEffect(() => {
    if (!isMountedRef.current) { isMountedRef.current = true; return; }
    setHasPet(null); setPhotos([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petIdFromContext]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  function setTemporaryTodayPhoto(uri: string, externalId = 'today-photo-uploading') {
    const now = new Date().toISOString();
    setPhotos((current) => [
      {
        externalId,
        petExternalId: '',
        date: today,
        photoUri: uri,
        createdAt: now,
        updatedAt: now,
      },
      ...current.filter((photo) => photo.date !== today && photo.externalId !== externalId),
    ]);
  }

  function replaceTemporaryPhoto(photo: LocalPhoto) {
    setPhotos((current) => [
      photo,
      ...current.filter((item) => item.externalId !== 'today-photo-uploading' && item.externalId !== photo.externalId),
    ]);
  }

  function handlePhotoTaken(photoUri: string) {
    setUploadState({ status: 'idle' });
    setFailedUpload(null);
    setPendingPhotoUri(photoUri);
    setModalVisible(true);
  }

  async function handleOpenGallery() {
    if (uploadState.status !== 'idle' && uploadState.status !== 'failed') return;
    debugPhotoUpload('picker start');
    const petId = await getCachedCurrentPetId();
    if (!petId) {
      Alert.alert('알림', '프로필 탭에서 반려동물을 먼저 등록해주세요.');
      return;
    }
    const uri = await pickImageUri({ allowsEditing: true, aspect: [1, 1] });
    debugPhotoUpload('picker result', { selectedPet: petId, selectedDate: today, uri });
    if (!uri) return;
    handlePhotoTaken(uri);
  }

  function handleTapTodayPhoto() {
    if (todayPhoto) router.push(`/photo/${todayPhoto.externalId}`);
  }

  async function handleSavePhoto(caption: string) {
    setModalVisible(false);
    const petId = await getCachedCurrentPetId();
    if (!petId || !pendingPhotoUri) return;

    const sourceUri = pendingPhotoUri;
    setPendingPhotoUri(null);
    setUploadState({ status: 'preparing', progress: 10 });
    setTemporaryTodayPhoto(sourceUri);
    await saveOrUploadTodayPhoto({ sourceUri, caption });
  }

  async function saveOrUploadTodayPhoto({
    sourceUri,
    caption,
    preparedUri,
    externalId,
    response,
  }: {
    sourceUri: string;
    caption: string;
    preparedUri?: string;
    externalId?: string;
    response?: LocalPhoto;
  }) {
    const petId = await getCachedCurrentPetId();
    if (!petId) return;
    let lastPreparedUri = preparedUri;
    let lastExternalId = externalId;
    let lastResponse = response;
    try {
      setFailedUpload(null);
      debugPhotoUpload('selectedPet', petId);
      debugPhotoUpload('selectedDate', today);
      debugPhotoUpload('original uri/size', {
        uri: sourceUri,
        size: await getDebugUriSize(sourceUri),
      });
      setUploadState({ status: 'compressing', progress: 25 });
      const uploadUri = lastPreparedUri ?? (await prepareImageForUpload(sourceUri, { maxWidth: 1080, compress: 0.75 })).uri;
      lastPreparedUri = uploadUri;
      debugPhotoUpload('compressed uri/size', {
        uri: uploadUri,
        size: await getDebugUriSize(uploadUri),
      });
      setTemporaryTodayPhoto(uploadUri, externalId ?? 'today-photo-uploading');

      // takenAt의 날짜 부분을 today(KST)로 고정하여 그리드 분류 일치
      const timeStr = new Date().toISOString().split('T')[1];
      const takenAt = `${today}T${timeStr}`;

      let savedResponse = lastResponse;
      let savedExternalId = lastExternalId;

      if (!savedExternalId || !savedResponse) {
        setUploadState({ status: 'saving', progress: 45 });
        const existingTodayPhoto = photosRef.current.find((photo) => (
          photo.date === today && photo.externalId !== 'today-photo-uploading'
        ));

        if (existingTodayPhoto?.externalId) {
          debugPhotoUpload('reuse existing dailyPhoto externalId', existingTodayPhoto.externalId);
          savedExternalId = existingTodayPhoto.externalId;
          savedResponse = {
            ...existingTodayPhoto,
            photoUri: uploadUri,
            caption: caption || existingTodayPhoto.caption,
            updatedAt: new Date().toISOString(),
          };
          lastExternalId = savedExternalId;
          lastResponse = savedResponse;
          if (caption) {
            await photoApi.updatePhoto(savedExternalId, { caption });
          }
          await savePhotoLocal(savedExternalId, uploadUri);
          replaceTemporaryPhoto(savedResponse);
        } else {
          const serverPhotos = await photoApi.getPhotos(petId);
          const serverTodayPhoto = serverPhotos.find((photo) => (
            (photo.date ?? photo.takenAt?.slice(0, 10) ?? photo.createdAt?.slice(0, 10)) === today
          ));

          if (serverTodayPhoto?.externalId) {
            debugPhotoUpload('reuse server dailyPhoto externalId', serverTodayPhoto.externalId);
            savedExternalId = serverTodayPhoto.externalId;
            savedResponse = {
              ...serverTodayPhoto,
              petExternalId: serverTodayPhoto.petExternalId ?? petId,
              date: serverTodayPhoto.date ?? today,
              photoUri: uploadUri,
              caption: caption || serverTodayPhoto.caption,
            };
            lastExternalId = savedExternalId;
            lastResponse = savedResponse;
            if (caption) {
              await photoApi.updatePhoto(savedExternalId, { caption });
            }
            await setCachedPhotos(petId, serverPhotos);
            await savePhotoLocal(savedExternalId, uploadUri);
            replaceTemporaryPhoto(savedResponse);
          } else {
            let caregiverId = await getCachedCurrentCaregiverId();
            debugPhotoUpload('caregiverId cache', caregiverId);

            if (!caregiverId) {
              debugPhotoUpload('caregiverId missing, init retry');
              await initCaregiver();
              caregiverId = await getCachedCurrentCaregiverId();
              debugPhotoUpload('caregiverId after retry', caregiverId);
            }

            const created = await photoApi.createPhoto({
              petExternalId: petId,
              caregiverExternalId: caregiverId ?? undefined,
              date: today,
              takenAt,
              caption: caption || undefined,
            });
            debugPhotoUpload('dailyPhoto externalId', created.externalId);

            savedExternalId = created.externalId;
            savedResponse = {
              ...created,
              petExternalId: created.petExternalId ?? petId,
              date: created.date ?? today,
              photoUri: uploadUri,
              caption: created.caption ?? caption,
            };
            lastExternalId = savedExternalId;
            lastResponse = savedResponse;

            await savePhotoLocal(created.externalId, uploadUri);
            await upsertCachedPhoto(petId, created);
            replaceTemporaryPhoto(savedResponse);
          }
        }
      }

      if (!savedExternalId || !savedResponse) {
        throw new Error('사진 저장 정보를 찾지 못했어요.');
      }

      setUploadState({ status: 'uploading', progress: 70 });
      const { medium, thumbnail } = await generateThumbnails(uploadUri);
      debugPhotoUpload('upload start', {
        dailyPhotoExternalId: savedExternalId,
        mediumUri: medium.uri,
        thumbnailUri: thumbnail.uri,
      });
      const uploadResponse = await photoApi.uploadPhoto(savedExternalId, medium, thumbnail);
      debugPhotoUpload('upload success', uploadResponse);

      await upsertCachedPhoto(petId, { ...savedResponse, ...uploadResponse });
      replaceTemporaryPhoto({ ...savedResponse, ...uploadResponse, photoUri: uploadUri });
      setUploadState({ status: 'success', progress: 100 });
      if (uploadTimerRef.current) clearTimeout(uploadTimerRef.current);
      uploadTimerRef.current = setTimeout(() => setUploadState({ status: 'idle' }), 1500);
    } catch (e) {
      debugPhotoUpload('upload fail', e);
      logger.warn('photo.tab.upload.failed', toLogError(e));
      setFailedUpload({
        sourceUri,
        preparedUri: lastPreparedUri,
        caption,
        externalId: lastExternalId,
        response: lastResponse,
      });
      setUploadState({
        status: 'failed',
        errorMessage: '사진을 올리지 못했어요. 다시 시도해주세요.',
      });
    }
  }

  async function handleRetryUpload() {
    if (!failedUpload || uploadState.status !== 'failed') return;
    setUploadState({ status: 'preparing', progress: 10 });
    await saveOrUploadTodayPhoto(failedUpload);
  }

  function handleCancelModal() {
    setModalVisible(false);
    setPendingPhotoUri(null);
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
        <View>
          <TodayPhotoCard
            todayPhoto={todayPhoto}
            onPhotoTaken={handlePhotoTaken}
            onTapGallery={handleOpenGallery}
            onTapPhoto={handleTapTodayPhoto}
          />
          {uploadState.status !== 'idle' && (
            <View style={[styles.uploadOverlay, uploadState.status === 'failed' && styles.uploadErrorOverlay]}>
              {uploadState.status !== 'failed' && uploadState.status !== 'success' ? (
                <ActivityIndicator color={colors.textOnPrimary} />
              ) : null}
              {uploadState.status === 'failed' ? (
                <>
                  <Text style={styles.uploadOverlayText}>
                    {uploadState.errorMessage ?? '사진을 올리지 못했어요. 다시 시도해주세요.'}
                  </Text>
                  <TouchableOpacity style={styles.uploadRetryButton} onPress={handleRetryUpload}>
                    <Text style={styles.uploadRetryText}>재시도</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          )}
        </View>
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

      {pendingPhotoUri && (
        <CaptionModal
          visible={modalVisible}
          photoBase64={pendingPhotoUri}
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
    backgroundColor: colors.warningBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  comingSoonBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
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
  cellNoLocal: {
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellNoLocalIcon: {
    fontSize: 24,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(25,31,40,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  uploadErrorOverlay: {
    backgroundColor: 'rgba(233,75,90,0.72)',
  },
  uploadOverlayText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  uploadRetryButton: {
    marginTop: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  uploadRetryText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
  },
});
