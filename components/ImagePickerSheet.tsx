import * as ImagePicker from 'expo-image-picker';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { showAlert } from '../lib/dialog';
import { logger } from '../lib/logger';

export interface ImagePickerSheetProps {
  visible: boolean;
  allowsEditing?: boolean;
  aspect?: [number, number];
  onSelect: (uri: string) => void;
  onClose: () => void;
}

export default function ImagePickerSheet({
  visible,
  allowsEditing = false,
  aspect,
  onSelect,
  onClose,
}: ImagePickerSheetProps) {
  function dismissThen(action: () => Promise<void>) {
    onClose();
    setTimeout(action, 350);
  }

  async function launchCamera() {
    if (Platform.OS === 'web') {
      await launchLibrary();
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      logger.warn('image.camera.permission.denied');
      showAlert(
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
      showAlert('권한 필요', '사진 접근 권한이 필요합니다.');
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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.menuGroup}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => dismissThen(launchCamera)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.menuText}>카메라로 촬영하기</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => dismissThen(launchLibrary)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.menuText}>앨범에서 고르기</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.6}>
                <Text style={styles.cancelText}>취소</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    padding: spacing.sm,
    paddingBottom: 34,
  },
  menuGroup: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  menuItem: {
    height: 56,
    paddingHorizontal: spacing.lg + 4,
    justifyContent: 'center',
  },
  menuText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.lg + 4,
  },
  cancelButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
