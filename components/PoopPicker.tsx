import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { StoolCondition, UrineColor } from '../lib/types';

const STOOL_OPTIONS: { value: StoolCondition; label: string }[] = [
  { value: 'normal', label: '정상' },
  { value: 'soft', label: '무름' },
  { value: 'hard', label: '딱딱' },
  { value: 'diarrhea', label: '설사' },
];

const URINE_OPTIONS: { value: UrineColor; label: string }[] = [
  { value: 'normal', label: '정상' },
  { value: 'pale', label: '연함' },
  { value: 'dark', label: '진함' },
];

interface Props {
  pooCondition?: StoolCondition;
  urineColor?: UrineColor;
  pooNote?: string;
  onChangePooCondition: (value: StoolCondition | undefined) => void;
  onChangeUrineColor: (value: UrineColor | undefined) => void;
  onChangePooNote: (value: string) => void;
}

export default function PoopPicker({
  pooCondition,
  urineColor,
  pooNote,
  onChangePooCondition,
  onChangeUrineColor,
  onChangePooNote,
}: Props) {
  return (
    <View>
      {/* 대변 */}
      <Text style={styles.label}>대변 💩</Text>
      <View style={styles.optionRow}>
        {STOOL_OPTIONS.map((opt) => {
          const selected = pooCondition === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.optionBtn, selected && styles.optionBtnSelected]}
              onPress={() => onChangePooCondition(pooCondition === opt.value ? undefined : opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.divider} />

      {/* 소변 */}
      <Text style={styles.label}>소변 💧</Text>
      <View style={styles.optionRow}>
        {URINE_OPTIONS.map((opt) => {
          const selected = urineColor === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.optionBtn, selected && styles.optionBtnSelected]}
              onPress={() => onChangeUrineColor(urineColor === opt.value ? undefined : opt.value)}
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
        value={pooNote}
        onChangeText={onChangePooNote}
        placeholder="특이사항 (선택)"
        placeholderTextColor={colors.textQuaternary}
        maxLength={100}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
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
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 12,
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
