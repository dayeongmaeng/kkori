import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { DailyPhoto } from '../lib/types';

interface Props {
  todayPhoto?: DailyPhoto;
  onTapCamera: () => void;
  onTapGallery: () => void;
  onTapPhoto: () => void;
  aspectRatio?: number;
}

function DashedCard({
  aspectRatio,
  onTapCamera,
  onTapGallery,
  children,
}: {
  aspectRatio: number;
  onTapCamera: () => void;
  onTapGallery: () => void;
  children?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={[styles.emptyCard, { aspectRatio }]}
      onPress={onTapCamera}
      activeOpacity={0.85}
    >
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
  onShutter,
}: {
  aspectRatio: number;
  onTapGallery: () => void;
  onShutter: () => void;
}) {
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const isFocused = useIsFocused();

  return (
    <View style={[styles.cameraCard, { aspectRatio }]}>
      {isFocused && (
        <CameraView style={StyleSheet.absoluteFill} facing={facing} />
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
      <TouchableOpacity style={styles.shutterWrapper} onPress={onShutter} activeOpacity={0.8}>
        <View style={styles.shutterOuter}>
          <View style={styles.shutterInner} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default function TodayPhotoCard({
  todayPhoto,
  onTapCamera,
  onTapGallery,
  onTapPhoto,
  aspectRatio = 1,
}: Props) {
  // 사진 있을 때
  if (todayPhoto) {
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

  // 웹: CameraView 미지원 → 기존 점선 카드
  if (Platform.OS === 'web') {
    return (
      <DashedCard aspectRatio={aspectRatio} onTapCamera={onTapCamera} onTapGallery={onTapGallery} />
    );
  }

  return (
    <CameraPermissionGate
      aspectRatio={aspectRatio}
      onTapCamera={onTapCamera}
      onTapGallery={onTapGallery}
    />
  );
}

function CameraPermissionGate({
  aspectRatio,
  onTapCamera,
  onTapGallery,
}: {
  aspectRatio: number;
  onTapCamera: () => void;
  onTapGallery: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();

  // 아직 권한 상태 미확인
  if (!permission) return null;

  // 권한 미결정 → 요청 유도
  if (!permission.granted && permission.canAskAgain) {
    return (
      <DashedCard aspectRatio={aspectRatio} onTapCamera={requestPermission} onTapGallery={onTapGallery}>
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

  // 권한 영구 거부 → 설정 유도
  if (!permission.granted) {
    return (
      <DashedCard aspectRatio={aspectRatio} onTapCamera={onTapCamera} onTapGallery={onTapGallery}>
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

  // 권한 허용 → 라이브 카메라
  return (
    <LiveCameraCard
      aspectRatio={aspectRatio}
      onTapGallery={onTapGallery}
      onShutter={onTapCamera}
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
