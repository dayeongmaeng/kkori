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
  pooCount?: number;
  pooCondition?: StoolCondition;
  peeCount?: number;
  urineColor?: UrineColor;
  pooNote?: string;
  onChangePooCount: (value: number | undefined) => void;
  onChangePooCondition: (value: StoolCondition | undefined) => void;
  onChangePeeCount: (value: number | undefined) => void;
  onChangeUrineColor: (value: UrineColor | undefined) => void;
  onChangePooNote: (value: string) => void;
}

function CountStepper({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
  const count = value ?? 0;

  function handleMinus() {
    const next = count - 1;
    onChange(next <= 0 ? undefined : next);
  }

  function handlePlus() {
    const next = count + 1;
    onChange(next > 10 ? 10 : next);
  }

  return (
    <View style={stepperStyles.row}>
      <TouchableOpacity
        style={[stepperStyles.btn, count === 0 && stepperStyles.btnDisabled]}
        onPress={handleMinus}
        activeOpacity={0.7}
        disabled={count === 0}
      >
        <Text style={stepperStyles.btnText}>−</Text>
      </TouchableOpacity>
      <Text style={stepperStyles.count}>{count}</Text>
      <TouchableOpacity
        style={[stepperStyles.btn, count >= 10 && stepperStyles.btnDisabled]}
        onPress={handlePlus}
        activeOpacity={0.7}
        disabled={count >= 10}
      >
        <Text style={stepperStyles.btnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 22,
  },
  count: {
    width: 28,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
});

export default function PoopPicker({
  pooCount,
  pooCondition,
  peeCount,
  urineColor,
  pooNote,
  onChangePooCount,
  onChangePooCondition,
  onChangePeeCount,
  onChangeUrineColor,
  onChangePooNote,
}: Props) {
  function handleConditionPress(value: StoolCondition) {
    onChangePooCondition(pooCondition === value ? undefined : value);
  }

  function handleUrineColorPress(value: UrineColor) {
    onChangeUrineColor(urineColor === value ? undefined : value);
  }

  return (
    <View>
      <View style={styles.container}>
        {/* 대변 */}
        <View style={styles.column}>
          <Text style={styles.columnTitle}>대변 💩</Text>
          <View style={styles.pooRow}>
            <CountStepper value={pooCount} onChange={onChangePooCount} />
            <View style={styles.conditionRow}>
              {STOOL_OPTIONS.map((opt) => {
                const selected = pooCondition === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.conditionBtn, selected && styles.conditionBtnSelected]}
                    onPress={() => handleConditionPress(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.conditionText, selected && styles.conditionTextSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* 소변 */}
        <View style={styles.column}>
          <Text style={styles.columnTitle}>소변 💧</Text>
          <View style={styles.pooRow}>
            <CountStepper value={peeCount} onChange={onChangePeeCount} />
            <View style={styles.conditionRow}>
              {URINE_OPTIONS.map((opt) => {
                const selected = urineColor === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.conditionBtn, selected && styles.conditionBtnSelected]}
                    onPress={() => handleUrineColorPress(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.conditionText, selected && styles.conditionTextSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
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
  container: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  column: {
    flex: 1,
    gap: spacing.sm + 2,
  },
  columnTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  divider: {
    width: 1,
    backgroundColor: colors.divider,
  },
  pooRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  conditionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    flex: 1,
  },
  conditionBtn: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.surfaceAlt,
  },
  conditionBtnSelected: {
    backgroundColor: colors.primary,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  conditionTextSelected: {
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
