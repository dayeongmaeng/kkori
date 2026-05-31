import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius } from '../constants/theme';
import { ConditionScore } from '../lib/types';

const dogConditionImages: Record<ConditionScore, ReturnType<typeof require>> = {
  1: require('../assets/conditions/dog-1.svg'),
  2: require('../assets/conditions/dog-2.svg'),
  3: require('../assets/conditions/dog-3.svg'),
  4: require('../assets/conditions/dog-4.svg'),
  5: require('../assets/conditions/dog-5.svg'),
};

const catConditionImages: Record<ConditionScore, ReturnType<typeof require>> = {
  1: require('../assets/conditions/cat-1.svg'),
  2: require('../assets/conditions/cat-2.svg'),
  3: require('../assets/conditions/cat-3.svg'),
  4: require('../assets/conditions/cat-4.svg'),
  5: require('../assets/conditions/cat-5.svg'),
};

const CONDITION_IMAGES: Record<'dog' | 'cat', Record<ConditionScore, ReturnType<typeof require>>> = {
  dog: dogConditionImages,
  cat: catConditionImages,
};

const OPTIONS: { value: ConditionScore; emoji: string }[] = [
  { value: 1, emoji: '😴' },
  { value: 2, emoji: '😟' },
  { value: 3, emoji: '🙂' },
  { value: 4, emoji: '😊' },
  { value: 5, emoji: '🤩' },
];

function ConditionImage({
  score,
  selected,
  iconSet,
}: {
  score: ConditionScore;
  selected: boolean;
  iconSet: 'dog' | 'cat';
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <Text style={selected ? styles.emojiSelected : styles.emoji}>
        {OPTIONS[score - 1].emoji}
      </Text>
    );
  }

  return (
    <Image
      source={CONDITION_IMAGES[iconSet][score]}
      style={[styles.image, selected && styles.imageSelected]}
      contentFit="contain"
      onError={() => setFailed(true)}
    />
  );
}

interface Props {
  value?: ConditionScore;
  onChange: (value: ConditionScore | undefined) => void;
  iconSet?: 'dog' | 'cat';
}

export default function ConditionPicker({ value, onChange, iconSet = 'dog' }: Props) {
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
            style={[
              styles.btn,
              selected && styles.btnSelected,
              value !== undefined && !selected && styles.btnDimmed,
            ]}
            onPress={() => handlePress(opt.value)}
            activeOpacity={0.7}
          >
            <ConditionImage score={opt.value} selected={selected} iconSet={iconSet} />
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
    aspectRatio: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSelected: {
    backgroundColor: colors.surfaceAlt,
  },
  btnDimmed: {
    opacity: 0.4,
  },
  image: {
    width: '75%',
    aspectRatio: 1,
  },
  imageSelected: {
    width: '88%',
  },
  emoji: {
    fontSize: 32,
  },
  emojiSelected: {
    fontSize: 38,
  },
});
