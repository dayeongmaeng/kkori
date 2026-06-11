import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { logger } from '../lib/logger';

const NUM_COLS = 3;
const GRID_ROWS = 3;
// 그리드 셀 수: 카메라 1칸 + 사진 8칸 = 9칸 (3×3)
const PHOTO_COUNT = NUM_COLS * GRID_ROWS - 1;
const SCREEN_W = Dimensions.get('window').width;
const GAP = 1;
// 셀 너비: 화면 너비에서 열 사이 gap(2개)을 빼고 3등분
const CELL_SIZE = Math.floor((SCREEN_W - GAP * (NUM_COLS - 1)) / NUM_COLS);

export interface ImagePickerSheetProps {
  visible: boolean;
  allowsEditing?: boolean;
  aspect?: [number, number];
  onSelect: (uri: string) => void;
  onClose: () => void;
}

type GridItem = { kind: 'camera' } | { kind: 'photo'; asset: MediaLibrary.Asset };

export default function ImagePickerSheet({
  visible,
  allowsEditing = false,
  aspect,
  onSelect,
  onClose,
}: ImagePickerSheetProps) {
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);

  useEffect(() => {
    if (!visible || Platform.OS === 'web') {
      return;
    }
    let cancelled = false;

    async function loadRecent() {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (cancelled || status !== 'granted') return;
      const { assets: recent } = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: PHOTO_COUNT + 5,
        sortBy: [['creationTime', false]],
      });
      if (!cancelled) setAssets(recent);
    }
    loadRecent();
    return () => { cancelled = true; };
  }, [visible]);

  // 시트를 닫은 뒤 모달 닫힘 애니메이션이 끝나고 나서 action 실행
  function dismissThen(action: () => Promise<void>) {
    onClose();
    setTimeout(action, 350);
  }

  async function launchCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      logger.warn('image.camera.permission.denied');
      Alert.alert(
        '카메라 권한이 필요해요',
        '카메라 접근 권한을 허용해야 사진을 촬영할 수 있어요.\n설정에서 권한을 허용해주세요.',
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing,
      ...(aspect ? { aspect } : {}),
      quality: 1,
    });
    logger.debug(result.canceled ? 'image.camera.canceled' : 'image.camera.captured');
    if (!result.canceled && result.assets?.[0]) {
      onSelect(result.assets[0].uri);
    }
  }

  async function launchLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: false,
      allowsEditing,
      ...(aspect ? { aspect } : {}),
      quality: 1,
    });
    logger.debug(result.canceled ? 'image.picker.canceled' : 'image.picker.selected');
    if (!result.canceled && result.assets?.[0]) {
      onSelect(result.assets[0].uri);
    }
  }

  async function handlePhotoCell(asset: MediaLibrary.Asset) {
    onClose();
    const info = await MediaLibrary.getAssetInfoAsync(asset);
    const uri = info.localUri ?? asset.uri;
    if (uri) onSelect(uri);
  }

  const gridItems: GridItem[] = [
    { kind: 'camera' },
    ...assets.slice(0, PHOTO_COUNT).map((a) => ({ kind: 'photo' as const, asset: a })),
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>사진 선택</Text>
            <TouchableOpacity
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={onClose}
            >
              <Ionicons name="close" size={22} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* 그리드: Web에서는 숨김 */}
          {Platform.OS !== 'web' && (
            <View style={styles.grid}>
              {gridItems.map((item, i) => {
                if (item.kind === 'camera') {
                  return (
                    <TouchableOpacity
                      key="camera"
                      style={[styles.cell, styles.cameraCell]}
                      onPress={() => dismissThen(launchCamera)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="camera-outline" size={28} color={colors.textSecondary} />
                      <Text style={styles.cameraLabel}>카메라</Text>
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={item.asset.id ?? String(i)}
                    style={styles.cell}
                    onPress={() => handlePhotoCell(item.asset)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: item.asset.uri }}
                      style={styles.cellImg}
                      contentFit="cover"
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* 전체 앨범 버튼 */}
          <TouchableOpacity
            style={styles.albumBtn}
            onPress={() => dismissThen(launchLibrary)}
            activeOpacity={0.8}
          >
            <Ionicons name="images-outline" size={18} color={colors.primary} />
            <Text style={styles.albumBtnText}>전체 앨범에서 선택</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: 36,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: colors.surfaceAlt,
  },
  cameraCell: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  cameraLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  cellImg: {
    width: '100%',
    height: '100%',
  },
  albumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 13,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  albumBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
});
