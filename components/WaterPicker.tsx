import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { WaterAmount } from '../lib/types';

const OPTIONS: { value: WaterAmount; label: string }[] = [
  { value: 'less', label: '적음' },
  { value: 'normal', label: '평소' },
  { value: 'more', label: '많음' },
];

interface Props {
  water?: WaterAmount;
  waterNote?: string;
  onChangeWater: (value: WaterAmount | undefined) => void;
  onChangeNote: (value: string) => void;
}

export default function WaterPicker({ water, waterNote, onChangeWater, onChangeNote }: Props) {
  function handlePress(value: WaterAmount) {
    onChangeWater(water === value ? undefined : value);
  }

  return (
    <View>
      <View style={styles.row}>
        {OPTIONS.map((opt) => {
          const selected = water === opt.value;
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
        value={waterNote}
        onChangeText={onChangeNote}
        placeholder="특이사항 (선택)"
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
    fontSize: 16,
    color: colors.textPrimary,
  },
});
