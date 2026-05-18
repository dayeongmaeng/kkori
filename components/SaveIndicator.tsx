import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../constants/theme';
import { SaveStatus } from '../hooks/useAutoSave';

interface Props {
  status: SaveStatus;
  labels?: Partial<Record<Exclude<SaveStatus, 'idle'>, string>>;
  textColors?: Partial<Record<Exclude<SaveStatus, 'idle'>, string>>;
  centered?: boolean;
}

const config: Record<Exclude<SaveStatus, 'idle'>, { label: string; bg: string; textColor: string }> = {
  saving: { label: '저장 중...',  bg: 'rgba(0,0,0,0.45)', textColor: 'rgba(255,255,255,0.75)' },
  saved:  { label: '저장됨 ✓',   bg: 'rgba(0,0,0,0.55)', textColor: 'rgba(255,255,255,0.90)' },
  error:  { label: '저장 실패',   bg: 'rgba(0,0,0,0.55)', textColor: '#FF8A8A' },
};

export default function SaveIndicator({ status, labels, textColors, centered }: Props) {
  const [visible, setVisible] = useState(false);
  const [displayStatus, setDisplayStatus] = useState<Exclude<SaveStatus, 'idle'>>('saving');
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status !== 'idle') {
      setDisplayStatus(status);
      setVisible(true);
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, useNativeDriver: true, speed: 24, bounciness: 6 }),
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scale,   { toValue: 0.8, useNativeDriver: true, speed: 24, bounciness: 0 }),
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start(() => setVisible(false));
    }
  }, [status, scale, opacity]);

  if (!visible) return null;

  const cfg = config[displayStatus];
  const { bg } = cfg;
  const label = labels?.[displayStatus] ?? cfg.label;
  const textColor = textColors?.[displayStatus] ?? cfg.textColor;

  return (
    <Animated.View style={[styles.overlay, centered && styles.overlayCentered]}>
      <Animated.View
        style={[styles.toast, { backgroundColor: bg, opacity, transform: [{ scale }] }]}
      >
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: '25%',
    zIndex: 100,
    pointerEvents: 'none',
  },
  overlayCentered: {
    justifyContent: 'center',
    paddingTop: 0,
  },
  toast: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
