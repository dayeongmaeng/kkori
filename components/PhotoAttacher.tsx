import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
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
import { pickImageUri } from '../lib/imagePickerHelper';
import { ImageUploadStatus, prepareImageForUpload } from '../lib/imageUpload';
import { generateThumbnails } from '../lib/photoUtils';

const MAX_PHOTOS = 3;

export type LogPhotoAttachment = LogPhotoResponse & {
  localUri?: string;
  sourceUri?: string;
  status?: ImageUploadStatus | 'ready' | 'error';
  progress?: number;
  errorMessage?: string;
  tempId?: string;
};

interface Props {
  photos: LogPhotoAttachment[];
  disabled?: boolean;
  onChangePhotos: (photos: LogPhotoAttachment[]) => void;
  onEnsureLogExternalId: () => Promise<string | null>;
  onUploaded?: (photos: LogPhotoAttachment[]) => Promise<void> | void;
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

export default function PhotoAttacher({
  photos,
  disabled = false,
  onChangePhotos,
  onEnsureLogExternalId,
  onUploaded,
}: Props) {
  const [previewPhoto, setPreviewPhoto] = useState<LogPhotoAttachment | null>(null);

  async function commitPhotos(nextPhotos: LogPhotoAttachment[]) {
    onChangePhotos(nextPhotos);
    await onUploaded?.(nextPhotos.filter((p) => !isBusy(p.status) && !isFailed(p.status)));
  }

  function isBusy(status: LogPhotoAttachment['status']) {
    return status === 'compressing' || status === 'uploading' || status === 'saving';
  }

  function isFailed(status: LogPhotoAttachment['status']) {
    return status === 'failed' || status === 'error';
  }

  async function uploadLocalPhoto(tempId: string, sourceUri: string, basePhotos: LogPhotoAttachment[]) {
    try {
      onChangePhotos(basePhotos.map((photo) => (
        photo.tempId === tempId
          ? { ...photo, status: 'compressing', progress: 20, errorMessage: undefined }
          : photo
      )));
      const prepared = await prepareImageForUpload(sourceUri, { maxWidth: 1080, compress: 0.75 });
      const photosWithPrepared = basePhotos.map((photo) => (
        photo.tempId === tempId
          ? { ...photo, localUri: prepared.uri, status: 'saving' as const, progress: 45 }
          : photo
      ));
      onChangePhotos(photosWithPrepared);

      const logExternalId = await onEnsureLogExternalId();
      if (!logExternalId) throw new Error('기록을 먼저 저장하지 못했어요.');

      onChangePhotos(photosWithPrepared.map((photo) => (
        photo.tempId === tempId
          ? { ...photo, status: 'uploading' as const, progress: 70 }
          : photo
      )));
      const { medium, thumbnail } = await generateThumbnails(prepared.uri);
      const uploaded = await logApi.uploadLogPhoto(logExternalId, medium, thumbnail);

      const nextPhotos = photosWithPrepared.map((photo) => (
        photo.tempId === tempId
          ? { ...uploaded, localUri: prepared.uri, sourceUri, status: 'ready' as const, progress: 100 }
          : photo
      ));
      await commitPhotos(nextPhotos);
    } catch {
      onChangePhotos(basePhotos.map((photo) => (
        photo.tempId === tempId
          ? { ...photo, status: 'failed', progress: undefined, errorMessage: '업로드에 실패했어요' }
          : photo
      )));
    }
  }

  async function handleAdd() {
    if (disabled || photos.length >= MAX_PHOTOS) return;
    if (photos.some((p) => isBusy(p.status))) return;

    const sourceUri = await pickImageUri({ allowsEditing: false });
    if (!sourceUri) return;

    const tempId = `log-photo-${Date.now()}`;
    const tempPhoto: LogPhotoAttachment = {
      externalId: tempId,
      mediumUrl: '',
      thumbnailUrl: '',
      localUri: sourceUri,
      sourceUri,
      status: 'idle',
      progress: 0,
      tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextPhotos = [...photos, tempPhoto];
    onChangePhotos(nextPhotos);
    await uploadLocalPhoto(tempId, sourceUri, nextPhotos);
  }

  async function handleRetry(photo: LogPhotoAttachment) {
    const retryUri = photo.sourceUri ?? photo.localUri;
    if (!photo.tempId || !retryUri || disabled) return;
    const nextPhotos = photos.map((p) => (
      p.tempId === photo.tempId
        ? { ...p, status: 'compressing' as const, progress: 15, errorMessage: undefined }
        : p
    ));
    onChangePhotos(nextPhotos);
    await uploadLocalPhoto(photo.tempId, retryUri, nextPhotos);
  }

  async function handleRemove(photo: LogPhotoAttachment) {
    if (disabled) return;

    const nextPhotos = photos.filter((p) => getPhotoKey(p) !== getPhotoKey(photo));
    onChangePhotos(nextPhotos);

    if (photo.tempId || isFailed(photo.status)) {
      await onUploaded?.(nextPhotos.filter((p) => !isBusy(p.status) && !isFailed(p.status)));
      return;
    }

    try {
      const logExternalId = await onEnsureLogExternalId();
      if (logExternalId) {
        await logApi.deleteLogPhoto(logExternalId, photo.externalId);
      }
      await onUploaded?.(nextPhotos.filter((p) => p.status !== 'uploading' && p.status !== 'error'));
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
                    <Text style={styles.overlayText}>사진을 올리지 못했어요. 다시 시도해주세요.</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => handleRetry(photo)}>
                      <Text style={styles.retryBtnText}>재시도</Text>
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
    backgroundColor: 'rgba(233,75,90,0.72)',
  },
  overlayText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  retryBtn: {
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  retryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
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
