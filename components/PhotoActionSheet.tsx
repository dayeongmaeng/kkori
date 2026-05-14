import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onShare: () => void;
  onSaveToAlbum: () => void;
  onDelete: () => void;
}

export default function PhotoActionSheet({
  visible,
  onClose,
  onShare,
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
                <TouchableOpacity style={styles.menuItem} onPress={onShare} activeOpacity={0.6}>
                  <Text style={styles.menuText}>📤  공유하기</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.menuItem} onPress={onSaveToAlbum} activeOpacity={0.6}>
                  <Text style={styles.menuText}>💾  사진 저장</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.menuItem} onPress={onDelete} activeOpacity={0.6}>
                  <Text style={[styles.menuText, styles.menuTextDanger]}>🗑️  삭제</Text>
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
    padding: 8,
    paddingBottom: 34,
  },
  menuGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  menuItem: {
    height: 56,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  menuText: {
    fontSize: 16,
    color: '#333333',
  },
  menuTextDanger: {
    color: '#E74C3C',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 20,
  },
  cancelButton: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999999',
  },
});
