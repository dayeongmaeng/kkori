import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ConditionScore } from '../lib/types';

const OPTIONS: { value: ConditionScore; emoji: string }[] = [
  { value: 1, emoji: '😴' },
  { value: 2, emoji: '😟' },
  { value: 3, emoji: '🙂' },
  { value: 4, emoji: '😊' },
  { value: 5, emoji: '🤩' },
];

interface Props {
  value?: ConditionScore;
  onChange: (value: ConditionScore | undefined) => void;
}

export default function ConditionPicker({ value, onChange }: Props) {
  function handlePress(score: ConditionScore) {
    onChange(value === score ? undefined : score);
  }

  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.btn, selected && styles.btnSelected]}
            onPress={() => handlePress(opt.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.emoji, selected && styles.emojiSelected]}>
              {opt.emoji}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  btn: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSelected: {
    backgroundColor: '#FFF4E8',
  },
  emoji: {
    fontSize: 28,
  },
  emojiSelected: {
    fontSize: 32,
  },
});
