import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { StoolCondition, UrineAmount } from '../lib/types';

const STOOL_OPTIONS: { value: StoolCondition; label: string }[] = [
  { value: 'NORMAL', label: '정상' },
  { value: 'SOFT', label: '무름' },
  { value: 'HARD', label: '딱딱' },
  { value: 'DIARRHEA', label: '설사' },
];

const URINE_AMOUNT_OPTIONS: { value: UrineAmount; label: string }[] = [
  { value: 'LOW', label: '적음' },
  { value: 'NORMAL', label: '평소' },
  { value: 'HIGH', label: '많음' },
];

interface Props {
  pooCondition?: StoolCondition;
  pooNote?: string;
  urineAmount?: UrineAmount;
  urineNote?: string;
  onChangePooCondition: (value: StoolCondition | undefined) => void;
  onChangePooNote: (value: string) => void;
  onChangeUrineAmount: (value: UrineAmount | undefined) => void;
  onChangeUrineNote: (value: string) => void;
}

export default function CatToiletPicker({
  pooCondition,
  pooNote,
  urineAmount,
  urineNote,
  onChangePooCondition,
  onChangePooNote,
  onChangeUrineAmount,
  onChangeUrineNote,
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
      <TextInput
        style={styles.noteInput}
        value={pooNote}
        onChangeText={onChangePooNote}
        placeholder="특이사항 (선택)"
        placeholderTextColor={colors.textQuaternary}
        maxLength={100}
      />

      <View style={styles.divider} />

      {/* 소변 */}
      <Text style={styles.label}>소변 💧</Text>
      <View style={styles.optionRow}>
        {URINE_AMOUNT_OPTIONS.map((opt) => {
          const selected = urineAmount === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.optionBtn, selected && styles.optionBtnSelected]}
              onPress={() => onChangeUrineAmount(urineAmount === opt.value ? undefined : opt.value)}
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
        value={urineNote}
        onChangeText={onChangeUrineNote}
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
    fontSize: 15,
    color: colors.textPrimary,
  },
});
