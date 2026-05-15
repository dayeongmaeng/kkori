import { Image } from 'expo-image';
import { useState } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

const PREVIEW_SIZE = Math.round(Dimensions.get('window').width * 0.6);
const MAX_CAPTION = 100;

interface Props {
  visible: boolean;
  photoBase64: string;
  onSave: (caption: string) => void;
  onCancel: () => void;
}

export default function CaptionModal({ visible, photoBase64, onSave, onCancel }: Props) {
  const [caption, setCaption] = useState('');

  function handleSave() {
    onSave(caption.trim());
    setCaption('');
  }

  function handleCancel() {
    setCaption('');
    onCancel();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <Pressable style={styles.backdrop} onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.sheet}>
            {/* 미리보기 */}
            <Image
              source={{ uri: photoBase64 }}
              style={styles.preview}
              contentFit="cover"
            />

            {/* 캡션 입력 */}
            <TextInput
              style={styles.input}
              value={caption}
              onChangeText={(t) => setCaption(t.slice(0, MAX_CAPTION))}
              placeholder="오늘 어떤 하루였나요?"
              placeholderTextColor={colors.textQuaternary}
              multiline
              returnKeyType="done"
              blurOnSubmit
            />
            <Text style={styles.counter}>{caption.length}/{MAX_CAPTION}</Text>

            {/* 버튼 */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>저장</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  preview: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: radius.lg,
  },
  input: {
    width: '100%',
    minHeight: 72,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: colors.textQuaternary,
    marginTop: -8,
  },
  saveButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  cancelButton: {
    paddingVertical: spacing.xs,
  },
  cancelButtonText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
});
