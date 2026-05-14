import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius } from '../constants/theme';
import { ConditionScore } from '../lib/types';

// 실제 이미지 파일을 assets/conditions/1.png ~ 5.png에 넣으면 자동 적용
const conditionImages: Record<ConditionScore, ReturnType<typeof require>> = {
  1: require('../assets/conditions/1.png'),
  2: require('../assets/conditions/2.png'),
  3: require('../assets/conditions/3.png'),
  4: require('../assets/conditions/4.png'),
  5: require('../assets/conditions/5.png'),
};

const OPTIONS: { value: ConditionScore; emoji: string }[] = [
  { value: 1, emoji: '😴' },
  { value: 2, emoji: '😟' },
  { value: 3, emoji: '🙂' },
  { value: 4, emoji: '😊' },
  { value: 5, emoji: '🤩' },
];

function ConditionImage({ score, selected }: { score: ConditionScore; selected: boolean }) {
  const [failed, setFailed] = useState(false);
  const size = selected ? 52 : 48;

  if (failed) {
    return (
      <Text style={selected ? styles.emojiSelected : styles.emoji}>
        {OPTIONS[score - 1].emoji}
      </Text>
    );
  }

  return (
    <Image
      source={conditionImages[score]}
      style={{ width: size, height: size }}
      contentFit="contain"
      onError={() => setFailed(true)}
    />
  );
}

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
            <ConditionImage score={opt.value} selected={selected} />
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
    height: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSelected: {
    backgroundColor: colors.surfaceAlt,
  },
  emoji: {
    fontSize: 28,
  },
  emojiSelected: {
    fontSize: 32,
  },
});
