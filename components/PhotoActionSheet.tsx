import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onShare: () => void;
  onEditCaption?: () => void;
  onSaveToAlbum: () => void;
  onDelete: () => void;
}

export default function PhotoActionSheet({
  visible,
  onClose,
  onShare,
  onEditCaption,
  onSaveToAlbum,
  onDelete,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* 메뉴 그룹 */}
              <View style={styles.menuGroup}>
                {onEditCaption && (
                  <>
                    <TouchableOpacity style={styles.menuItem} onPress={onEditCaption} activeOpacity={0.6}>
                      <Text style={styles.menuText}>수정하기</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />
                  </>
                )}

                <TouchableOpacity style={styles.menuItem} onPress={onSaveToAlbum} activeOpacity={0.6}>
                  <Text style={styles.menuText}>저장하기</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.menuItem} onPress={onShare} activeOpacity={0.6}>
                  <Text style={styles.menuText}>공유하기</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.menuItem} onPress={onDelete} activeOpacity={0.6}>
                  <Text style={[styles.menuText, styles.menuTextDanger]}>삭제</Text>
                </TouchableOpacity>
              </View>

              {/* 취소 */}
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
  menuTextDanger: {
    color: colors.danger,
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
