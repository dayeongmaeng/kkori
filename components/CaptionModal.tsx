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
              placeholderTextColor="#C4B8A8"
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  preview: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: 16,
  },
  input: {
    width: '100%',
    minHeight: 72,
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E0D5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#3D2C1E',
    textAlignVertical: 'top',
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#B0A090',
    marginTop: -8,
  },
  saveButton: {
    width: '100%',
    backgroundColor: '#E8985C',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 4,
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#B0A090',
  },
});
