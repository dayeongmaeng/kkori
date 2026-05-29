import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

const COUNT_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: '없음' },
  { value: 1, label: '1회' },
  { value: 2, label: '2회' },
  { value: 3, label: '3회 이상' },
];

interface Props {
  count?: number;
  note?: string;
  onChangeCount: (value: number | undefined) => void;
  onChangeNote: (value: string) => void;
}

export default function VomitInput({ count, note, onChangeCount, onChangeNote }: Props) {
  return (
    <View>
      <View style={styles.optionRow}>
        {COUNT_OPTIONS.map((opt) => {
          const selected = count === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.optionBtn, selected && styles.optionBtnSelected]}
              onPress={() => onChangeCount(count === opt.value ? undefined : opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TextInput
        style={styles.noteInput}
        value={note}
        onChangeText={onChangeNote}
        placeholder="특이사항 (선택)"
        placeholderTextColor={colors.textQuaternary}
        maxLength={100}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
  },
  optionBtnSelected: {
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  optionTextSelected: {
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  noteInput: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
  },
});
