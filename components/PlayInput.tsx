import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

const QUICK_MINUTES = [10, 20, 30, 60];

interface Props {
  minutes?: number;
  note?: string;
  onChangeMinutes: (value: number | undefined) => void;
  onChangeNote: (value: string) => void;
}

export default function PlayInput({ minutes, note, onChangeMinutes, onChangeNote }: Props) {
  function handleTextChange(text: string) {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned === '') {
      onChangeMinutes(undefined);
      return;
    }
    const num = parseInt(cleaned, 10);
    onChangeMinutes(isNaN(num) ? undefined : num);
  }

  return (
    <View>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.minutesInput, minutes == null && styles.minutesInputPlaceholder]}
          value={minutes == null ? '' : String(minutes)}
          onChangeText={handleTextChange}
          keyboardType="number-pad"
          placeholder="놀이 안 함"
          placeholderTextColor={colors.textQuaternary}
          maxLength={3}
        />
        <Text style={styles.unit}>분</Text>
      </View>

      <View style={styles.quickRow}>
        {QUICK_MINUTES.map((min) => {
          const selected = minutes === min;
          return (
            <TouchableOpacity
              key={min}
              style={[styles.quickBtn, selected && styles.quickBtnSelected]}
              onPress={() => onChangeMinutes(min)}
              activeOpacity={0.7}
            >
              <Text style={[styles.quickBtnText, selected && styles.quickBtnTextSelected]}>
                {min}분
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TextInput
        style={styles.noteInput}
        value={note}
        onChangeText={onChangeNote}
        placeholder="놀이 종류, 특이사항 (선택)"
        placeholderTextColor={colors.textQuaternary}
        maxLength={100}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minutesInput: {
    width: 80,
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 2,
  },
  minutesInputPlaceholder: {
    fontSize: 18,
  },
  unit: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  quickBtn: {
    flex: 1,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnSelected: {
    backgroundColor: colors.primary,
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  quickBtnTextSelected: {
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
