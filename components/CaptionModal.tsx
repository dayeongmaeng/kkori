import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
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
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 250);

    return () => clearTimeout(timer);
  }, [visible]);

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
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
          style={styles.keyboardView}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={styles.scrollContent}
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
              ref={inputRef}
              style={styles.input}
              value={caption}
              onChangeText={(t) => setCaption(t.slice(0, MAX_CAPTION))}
              placeholder="한 줄 기록을 남겨보세요"
              placeholderTextColor={colors.textQuaternary}
              multiline
              editable
              autoFocus
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
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
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
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
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
