import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { showAlert } from '../lib/dialog';
import { LocalPhoto } from '../lib/cache/photo';
import { logger } from '../lib/logger';

interface Props {
  todayPhoto?: LocalPhoto;
  onPhotoTaken: (photoUri: string) => void;
  onTapGallery: () => void;
  onTapPhoto: () => void;
  aspectRatio?: number;
}

function DashedCard({
  onTap,
  onTapGallery,
  aspectRatio,
  children,
}: {
  onTap: () => void;
  onTapGallery: () => void;
  aspectRatio: number;
  children?: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={[styles.emptyCard, { aspectRatio }]} onPress={onTap} activeOpacity={0.85}>
      <TouchableOpacity
        style={styles.overlayTopRight}
        onPress={onTapGallery}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="images-outline" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {children ?? (
        <View style={styles.emptyCenter}>
          <Text style={styles.cameraEmoji}>📷</Text>
          <Text style={styles.emptyText}>오늘의 한 컷을 남겨주세요</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function LiveCameraCard({
  aspectRatio,
  onTapGallery,
  onPhotoTaken,
}: {
  aspectRatio: number;
  onTapGallery: () => void;
  onPhotoTaken: (photoUri: string) => void;
}) {
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const isFocused = useIsFocused();

  async function handleCapture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1, skipProcessing: false });
      if (!photo?.uri) throw new Error('촬영 데이터가 없어요.');
      onPhotoTaken(photo.uri);
    } catch (e: any) {
      showAlert('오류', `촬영 실패: ${e?.message ?? '알 수 없는 오류'}`);
    } finally {
      setCapturing(false);
    }
  }

  return (
    <View style={[styles.cameraCard, { aspectRatio }]}>
      {isFocused && (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />
      )}

      {/* 좌상단: 전/후면 전환 */}
      <TouchableOpacity
        style={styles.overlayTopLeft}
        onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
      </TouchableOpacity>

      {/* 우상단: 갤러리 */}
      <TouchableOpacity
        style={styles.overlayTopRight}
        onPress={onTapGallery}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="images-outline" size={18} color="#fff" />
      </TouchableOpacity>

      {/* 하단 중앙: 촬영 버튼 */}
      <TouchableOpacity
        style={styles.shutterWrapper}
        onPress={handleCapture}
        disabled={capturing}
        activeOpacity={0.8}
      >
        <View style={[styles.shutterOuter, capturing && styles.shutterCapturing]}>
          <View style={styles.shutterInner} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

function CameraPermissionGate({
  aspectRatio,
  onTapGallery,
  onPhotoTaken,
}: {
  aspectRatio: number;
  onTapGallery: () => void;
  onPhotoTaken: (photoUri: string) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) return null;

  if (!permission.granted && permission.canAskAgain) {
    return (
      <DashedCard aspectRatio={aspectRatio} onTap={requestPermission} onTapGallery={onTapGallery}>
        <View style={styles.emptyCenter}>
          <Text style={styles.cameraEmoji}>📷</Text>
          <Text style={styles.emptyText}>카메라 권한을 허용하면{'\n'}바로 찍을 수 있어요</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>권한 허용하기</Text>
          </TouchableOpacity>
        </View>
      </DashedCard>
    );
  }

  if (!permission.granted) {
    return (
      <DashedCard aspectRatio={aspectRatio} onTap={() => Linking.openSettings()} onTapGallery={onTapGallery}>
        <View style={styles.emptyCenter}>
          <Text style={styles.cameraEmoji}>📷</Text>
          <Text style={styles.emptyText}>카메라 권한을 허용하면{'\n'}바로 찍을 수 있어요</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={() => Linking.openSettings()}>
            <Text style={styles.permissionButtonText}>설정 열기</Text>
          </TouchableOpacity>
        </View>
      </DashedCard>
    );
  }

  return (
    <LiveCameraCard
      aspectRatio={aspectRatio}
      onTapGallery={onTapGallery}
      onPhotoTaken={onPhotoTaken}
    />
  );
}

export default function TodayPhotoCard({
  todayPhoto,
  onPhotoTaken,
  onTapGallery,
  onTapPhoto,
  aspectRatio = 1,
}: Props) {
  const [showFallback, setShowFallback] = useState(false);
  useEffect(() => { setShowFallback(false); }, [todayPhoto?.externalId]);

  // 사진 있을 때 — 다른 기기에서 찍어 로컬 데이터 없는 경우 회색 박스
  if (todayPhoto) {
    // S3 URL을 우선 사용. 업로드 직후처럼 S3 URL이 아직 없을 때만 로컬 URI 사용.
    // photoUri(blob URL)는 iOS Safari에서 세션 전환 시 만료되므로 마지막 fallback으로.
    const displayUri = todayPhoto.mediumUrl ?? todayPhoto.thumbnailUrl ?? todayPhoto.photoUri;

    if (showFallback) {
      return (
        <TouchableOpacity
          style={[styles.photoCard, styles.noLocalCard, { aspectRatio }]}
          onPress={onTapPhoto}
          activeOpacity={0.92}
        >
          <Text style={styles.noLocalEmoji}>🖼️</Text>
          <Text style={styles.noLocalText}>사진을 불러오지 못했어요</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.photoCard}
        onPress={onTapPhoto}
        activeOpacity={0.92}
      >
        {/* absoluteFill 대신 Image에 직접 aspectRatio를 지정 — iOS Safari에서 height 0 문제 방지 */}
        <Image
          source={{ uri: displayUri }}
          style={[styles.photoCardImage, { aspectRatio }]}
          contentFit="cover"
          onError={() => {
            if (__DEV__) {
              let logUri = displayUri;
              if (!displayUri.startsWith('blob:') && !displayUri.startsWith('data:')) {
                try { const u = new URL(displayUri); logUri = u.origin + u.pathname; } catch {}
              } else {
                logUri = displayUri.slice(0, 50);
              }
              logger.warn('photo.today_card.image.load_failed', { uri: logUri });
            }
            setShowFallback(true);
          }}
        />
      </TouchableOpacity>
    );
  }

  // 웹: CameraView 미지원 → 갤러리로 연결되는 점선 카드
  if (Platform.OS === 'web') {
    return (
      <DashedCard aspectRatio={aspectRatio} onTap={onTapGallery} onTapGallery={onTapGallery} />
    );
  }

  return (
    <CameraPermissionGate
      aspectRatio={aspectRatio}
      onTapGallery={onTapGallery}
      onPhotoTaken={onPhotoTaken}
    />
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    width: '100%',
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cameraCard: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  photoCard: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  photoCardImage: {
    width: '100%',
  },
  noLocalCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
  },
  noLocalEmoji: {
    fontSize: 36,
  },
  noLocalText: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  overlayTopLeft: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayTopRight: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterWrapper: {
    position: 'absolute',
    bottom: spacing.lg,
    alignSelf: 'center',
  },
  shutterOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCapturing: {
    opacity: 0.5,
  },
  shutterInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
  },
  emptyCenter: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  cameraEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionButton: {
    marginTop: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
  },
  permissionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textOnPrimary,
  },
});
