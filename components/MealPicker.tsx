import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { MealAmount } from '../lib/types';

const OPTIONS: { value: MealAmount; label: string }[] = [
  { value: 'none', label: '안 먹음' },
  { value: 'less', label: '적게' },
  { value: 'normal', label: '평소' },
  { value: 'more', label: '많이' },
];

interface Props {
  meal?: MealAmount;
  mealNote?: string;
  onChangeMeal: (value: MealAmount | undefined) => void;
  onChangeNote: (value: string) => void;
}

export default function MealPicker({ meal, mealNote, onChangeMeal, onChangeNote }: Props) {
  function handlePress(value: MealAmount) {
    onChangeMeal(meal === value ? undefined : value);
  }

  return (
    <View>
      <View style={styles.row}>
        {OPTIONS.map((opt) => {
          const selected = meal === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.btn, selected && styles.btnSelected]}
              onPress={() => handlePress(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnText, selected && styles.btnTextSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TextInput
        style={styles.noteInput}
        value={mealNote}
        onChangeText={onChangeNote}
        placeholder="사료 종류, 간식 등 (선택)"
        placeholderTextColor={colors.textQuaternary}
        maxLength={100}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSelected: {
    backgroundColor: colors.primary,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  btnTextSelected: {
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  noteInput: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
  },
});
