import { StyleSheet, TextInput } from 'react-native';

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
      placeholderTextColor="#C4B8A8"
      multiline
      maxLength={500}
      textAlignVertical="top"
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#3D2C1E',
    minHeight: 100,
  },
});
