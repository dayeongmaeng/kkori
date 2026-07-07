import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { logApi } from '../lib/api/log';
import type { LogPhotoResponse } from '../lib/api/log';
import ImagePickerSheet from './ImagePickerSheet';
import { generateThumbnails, ThumbnailFile } from '../lib/photoUtils';

const MAX_PHOTOS = 3;

export type LogPhotoAttachment = LogPhotoResponse & {
  localUri?: string;
  sourceUri?: string;
  // compressing: 로컬 압축 중 / local: 압축 완료, 저장 시 업로드 대기 / ready: 서버에 저장됨
  status?: 'compressing' | 'local' | 'failed' | 'ready';
  errorMessage?: string;
  tempId?: string;
  mediumFile?: ThumbnailFile;
  thumbnailFile?: ThumbnailFile;
};

interface Props {
  photos: LogPhotoAttachment[];
  disabled?: boolean;
  // 이미 저장된 기록의 externalId. 신규(미저장) 기록이면 null.
  logExternalId: string | null;
  onChangePhotos: (photos: LogPhotoAttachment[]) => void;
  // 이미 서버에 저장된 사진을 삭제해 캐시 동기화가 필요할 때만 호출된다.
  onPhotoRemoved?: (photos: LogPhotoAttachment[]) => Promise<void> | void;
  onPickerVisibleChange?: (visible: boolean) => void;
}

function getPhotoKey(photo: LogPhotoAttachment) {
  return photo.tempId ?? photo.externalId;
}

function getThumbUri(photo: LogPhotoAttachment) {
  return photo.localUri ?? photo.thumbnailUrl;
}

function getMediumUri(photo: LogPhotoAttachment) {
  return photo.mediumUrl || photo.localUri || photo.thumbnailUrl;
}

function isBusy(status: LogPhotoAttachment['status']) {
  return status === 'compressing';
}

function isFailed(status: LogPhotoAttachment['status']) {
  return status === 'failed';
}

export default function PhotoAttacher({
  photos,
  disabled = false,
  logExternalId,
  onChangePhotos,
  onPhotoRemoved,
  onPickerVisibleChange,
}: Props) {
  const [previewPhoto, setPreviewPhoto] = useState<LogPhotoAttachment | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  // 시트가 닫힌 뒤에도 실제 카메라/갤러리 네이티브 화면이 열려있는 동안(true)을 추적
  const [isLaunching, setIsLaunching] = useState(false);
  // 항상 최신 photos를 참조해 비동기 중간 stale closure 방지
  const photosRef = useRef(photos);
  photosRef.current = photos;

  // 시트가 보이거나, 네이티브 카메라/갤러리가 열려있거나, 로컬 압축이 진행 중이면
  // 상위 화면에 "사진 관련 작업 진행 중"임을 알려 그 사이의 AppState active 전환으로
  // 인한 리로드(및 미저장 옵션 초기화)를 막는다.
  const isFlowBusy = pickerVisible || isLaunching || photos.some((p) => isBusy(p.status));

  useEffect(() => {
    onPickerVisibleChange?.(isFlowBusy);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFlowBusy]);

  async function prepareLocalPhoto(tempId: string, sourceUri: string, initialTempPhoto?: LogPhotoAttachment) {
    // React가 re-render하기 전에 photosRef.current에 tempPhoto가 없을 수 있으므로
    // tempId가 없으면 initialTempPhoto를 포함해 동기 상태 갱신을 보장한다
    function currentPhotos(): LogPhotoAttachment[] {
      const curr = photosRef.current;
      if (curr.some((p) => p.tempId === tempId)) return curr;
      return initialTempPhoto ? [...curr, initialTempPhoto] : curr;
    }

    try {
      onChangePhotos(currentPhotos().map((photo) => (
        photo.tempId === tempId
          ? { ...photo, status: 'compressing', errorMessage: undefined }
          : photo
      )));
      const { medium, thumbnail } = await generateThumbnails(sourceUri);
      onChangePhotos(currentPhotos().map((photo) => (
        photo.tempId === tempId
          ? { ...photo, localUri: medium.uri, mediumFile: medium, thumbnailFile: thumbnail, status: 'local' as const }
          : photo
      )));
    } catch {
      onChangePhotos(currentPhotos().map((photo) => (
        photo.tempId === tempId
          ? { ...photo, status: 'failed', errorMessage: '사진 준비에 실패했어요' }
          : photo
      )));
    }
  }

  function handleAdd() {
    if (disabled || photos.length >= MAX_PHOTOS) return;
    if (photos.some((p) => isBusy(p.status))) return;
    setPickerVisible(true);
  }

  async function handlePickerSelect(sourceUri: string) {
    setPickerVisible(false);
    const tempId = `log-photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const tempPhoto: LogPhotoAttachment = {
      externalId: tempId,
      mediumUrl: '',
      thumbnailUrl: '',
      localUri: sourceUri,
      sourceUri,
      status: 'compressing',
      tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onChangePhotos([...photosRef.current, tempPhoto]);
    await prepareLocalPhoto(tempId, sourceUri, tempPhoto);
  }

  async function handleRetry(photo: LogPhotoAttachment) {
    const retryUri = photo.sourceUri ?? photo.localUri;
    if (!photo.tempId || !retryUri || disabled) return;
    await prepareLocalPhoto(photo.tempId, retryUri);
  }

  async function handleRemove(photo: LogPhotoAttachment) {
    if (disabled) return;

    const nextPhotos = photos.filter((p) => getPhotoKey(p) !== getPhotoKey(photo));

    // 아직 서버에 저장되지 않은 로컬 사진은 상태에서만 제거한다.
    if (photo.tempId) {
      onChangePhotos(nextPhotos);
      return;
    }

    // 이미 서버에 저장된 사진은 즉시 삭제 API를 호출한다.
    if (!logExternalId) return;
    onChangePhotos(nextPhotos);
    try {
      await logApi.deleteLogPhoto(logExternalId, photo.externalId);
      await onPhotoRemoved?.(nextPhotos);
    } catch {
      onChangePhotos(photos);
    }
  }

  function handlePressPhoto(photo: LogPhotoAttachment) {
    if (isBusy(photo.status) || isFailed(photo.status)) return;
    setPreviewPhoto(photo);
  }

  const canAdd = photos.length < MAX_PHOTOS && !disabled && !photos.some((p) => isBusy(p.status));

  return (
    <>
      <ImagePickerSheet
        visible={pickerVisible}
        allowsEditing
        aspect={[1, 1]}
        onSelect={handlePickerSelect}
        onClose={() => setPickerVisible(false)}
        onLaunchingChange={setIsLaunching}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {photos.map((photo) => (
            <View key={getPhotoKey(photo)} style={styles.photoWrapper}>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handlePressPhoto(photo)}
                activeOpacity={0.82}
                disabled={isBusy(photo.status) || isFailed(photo.status)}
              >
                {getThumbUri(photo) ? (
                  <Image source={{ uri: getThumbUri(photo) }} style={styles.photo} contentFit="cover" />
                ) : (
                  <View style={[styles.photo, styles.emptyPhoto]}>
                    <Ionicons name="image-outline" size={24} color={colors.textQuaternary} />
                  </View>
                )}

                {isBusy(photo.status) && (
                  <View style={styles.overlay}>
                    <ActivityIndicator color={colors.textOnPrimary} />
                  </View>
                )}

                {isFailed(photo.status) && (
                  <View style={[styles.overlay, styles.errorOverlay]}>
                    <TouchableOpacity
                      onPress={() => handleRetry(photo)}
                      accessibilityLabel="사진 준비 실패, 재시도"
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="refresh" size={24} color={colors.textOnPrimary} />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemove(photo)}
                activeOpacity={0.7}
                disabled={disabled}
              >
                <Ionicons name="close" size={14} color={colors.textOnPrimary} />
              </TouchableOpacity>
            </View>
          ))}

          {photos.length < MAX_PHOTOS && (
            <TouchableOpacity
              style={[styles.addBtn, !canAdd && styles.addBtnDisabled]}
              onPress={handleAdd}
              activeOpacity={0.7}
              disabled={!canAdd}
            >
              <Ionicons name="add" size={26} color={canAdd ? colors.textSecondary : colors.textQuaternary} />
              <Text style={styles.addBtnText}>{photos.length}/{MAX_PHOTOS}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={Boolean(previewPhoto)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewPhoto(null)}
      >
        <View style={styles.previewBackdrop}>
          <TouchableOpacity
            style={styles.previewClose}
            onPress={() => setPreviewPhoto(null)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={24} color={colors.textOnPrimary} />
          </TouchableOpacity>

          {previewPhoto && (
            <Image
              source={{ uri: getMediumUri(previewPhoto) }}
              style={styles.previewImage}
              contentFit="contain"
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: 6,
    paddingRight: spacing.sm,
  },
  photoWrapper: {
    width: 88,
    height: 88,
    paddingTop: 6,
    paddingRight: 6,
  },
  photoButton: {
    width: 80,
    height: 80,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  photo: {
    width: 80,
    height: 80,
  },
  emptyPhoto: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(25,31,40,0.58)',
  },
  errorOverlay: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  removeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 80,
    height: 80,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  previewClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 28,
    right: spacing.lg,
    zIndex: 1,
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '86%',
  },
});
