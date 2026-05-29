import { Alert, Platform } from 'react-native';

export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  options?: {
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmStyle?: 'default' | 'destructive';
  },
) {
  const {
    onCancel,
    confirmText = '확인',
    cancelText = '취소',
    confirmStyle = 'default',
  } = options ?? {};
  if (Platform.OS === 'web') {
    if (window.confirm(message)) {
      onConfirm();
    } else {
      onCancel?.();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel', onPress: onCancel },
    { text: confirmText, style: confirmStyle, onPress: onConfirm },
  ]);
}

export function showAlert(title: string, message?: string) {
  if (Platform.OS === 'web') {
    const text = message ? (title ? `${title}\n${message}` : message) : title;
    window.alert(text);
    return;
  }
  Alert.alert(title, message);
}
