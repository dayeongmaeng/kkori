import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, shadow, spacing } from '../constants/theme';
import { summarizeLog } from '../lib/logUtils';
import { DailyLog } from '../lib/types';

interface Props {
  todayLog?: DailyLog;
  onTapAdd: () => void;
  onTapView: () => void;
}

export default function HomeTodayLogCard({ todayLog, onTapAdd, onTapView }: Props) {
  if (!todayLog) {
    return (
      <TouchableOpacity style={[styles.card, styles.emptyCard]} onPress={onTapAdd} activeOpacity={0.85}>
        <View style={styles.row}>
          <Text style={styles.icon}>📝</Text>
          <View style={styles.textBlock}>
            <Text style={styles.mainText}>오늘 기록을 안 했어요</Text>
            <Text style={styles.subText}>지금 한 줄 남겨볼까요?</Text>
          </View>
          <View style={styles.addButton}>
            <Text style={styles.addButtonText}>+ 기록하기</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.card, styles.filledCard]} onPress={onTapView} activeOpacity={0.85}>
      <View style={styles.row}>
        <Text style={styles.icon}>✅</Text>
        <View style={styles.textBlock}>
          <Text style={styles.mainText}>오늘 기록 완료</Text>
          <Text style={styles.subText} numberOfLines={1}>{summarizeLog(todayLog)}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  emptyCard: {
    backgroundColor: colors.surfaceAlt,
  },
  filledCard: {
    backgroundColor: colors.surface,
    ...Platform.select({
      ios: shadow.sm,
      android: { elevation: shadow.sm.elevation },
      default: {},
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    fontSize: 28,
  },
  textBlock: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  mainText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textOnPrimary,
  },
  chevron: {
    fontSize: 22,
    color: colors.textQuaternary,
    lineHeight: 26,
  },
});
