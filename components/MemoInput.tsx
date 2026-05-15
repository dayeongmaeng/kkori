import { StyleSheet, TextInput } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

interface Props {
  value: string;
  onChangeText: (value: string) => void;
}

export default function MemoInput({ value, onChangeText }: Props) {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder="오늘 특별한 일은?"
      placeholderTextColor={colors.textQuaternary}
      multiline
      maxLength={500}
      textAlignVertical="top"
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 100,
  },
});
