import { Platform, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../constants/theme';

const cardShadow: ViewStyle = Platform.select<ViewStyle>({
  ios: {
    shadowColor: shadow.sm.shadowColor,
    shadowOffset: shadow.sm.shadowOffset,
    shadowOpacity: shadow.sm.shadowOpacity,
    shadowRadius: shadow.sm.shadowRadius,
  },
  android: { elevation: shadow.sm.elevation },
  default: {},
}) ?? {};
import { LogResponse } from '../lib/api/log';

const BAR_MAX_HEIGHT = 72;
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const CONDITION_COLOR: Record<number, string> = {
  1: colors.condition1,
  2: colors.condition2,
  3: colors.condition3,
  4: colors.condition4,
  5: colors.condition5,
};

// today는 KST 기준 'YYYY-MM-DD' 문자열 (useDate()에서 전달)
// UTC 산술로 계산해 로컬 타임존 영향을 받지 않도록 함
function getLast7Dates(today: string): string[] {
  const [y, m, d] = today.split('-').map(Number);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.UTC(y, m - 1, d - (6 - i)));
    return date.toISOString().slice(0, 10);
  });
}

interface Props {
  logs: LogResponse[];
  today: string;
}

export default function HomeConditionChart({ logs, today }: Props) {
  const dates = getLast7Dates(today);
  const logMap = new Map(logs.map((l) => [l.date, l]));

  const entries = dates.map((date) => ({
    date,
    dayLabel: DAY_LABELS[new Date(date).getDay()],
    condition: logMap.get(date)?.condition,
  }));

  const conditionValues = entries
    .filter((e) => e.condition != null)
    .map((e) => e.condition as number);

  const hasData = conditionValues.length > 0;
  const avg = hasData
    ? (conditionValues.reduce((a, b) => a + b, 0) / conditionValues.length).toFixed(1)
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>최근 7일 컨디션</Text>
        {avg && <Text style={styles.avg}>평균 {avg}</Text>}
      </View>

      {hasData ? (
        <View style={styles.chartArea}>
          {entries.map((entry) => (
            <View key={entry.date} style={styles.column}>
              <View style={styles.barContainer}>
                {entry.condition != null ? (
                  <View
                    style={[
                      styles.bar,
                      {
                        height: (entry.condition / 5) * BAR_MAX_HEIGHT,
                        backgroundColor: CONDITION_COLOR[entry.condition],
                      },
                    ]}
                  />
                ) : (
                  <View style={styles.emptyBar} />
                )}
              </View>
              <Text style={styles.dayLabel}>{entry.dayLabel}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyArea}>
          <Text style={styles.emptyText}>기록을 시작하면 추세가 보여요</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    ...cardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  avg: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  chartArea: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  barContainer: {
    width: '100%',
    height: BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '60%',
    borderRadius: radius.sm / 2,
  },
  emptyBar: {
    width: '60%',
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.divider,
  },
  dayLabel: {
    fontSize: 11,
    color: colors.textQuaternary,
  },
  emptyArea: {
    height: BAR_MAX_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textQuaternary,
  },
});
