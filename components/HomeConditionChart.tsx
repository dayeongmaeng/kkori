import { Platform, StyleSheet, Text, View } from 'react-native';
import { DailyLog } from '../lib/types';

const BAR_MAX_HEIGHT = 72;
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const CONDITION_COLOR: Record<number, string> = {
  1: '#FF6B6B',
  2: '#FFA94D',
  3: '#FFD43B',
  4: '#A9E34B',
  5: '#40C057',
};

function getLast7Dates(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

interface Props {
  logs: DailyLog[];
}

export default function HomeConditionChart({ logs }: Props) {
  const dates = getLast7Dates();
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3D2C1E',
  },
  avg: {
    fontSize: 13,
    color: '#8C7B6B',
  },
  chartArea: {
    flexDirection: 'row',
    gap: 4,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  barContainer: {
    width: '100%',
    height: BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '60%',
    borderRadius: 4,
  },
  emptyBar: {
    width: '60%',
    height: 3,
    borderRadius: 2,
    backgroundColor: '#EEEEEE',
  },
  dayLabel: {
    fontSize: 11,
    color: '#B0A090',
  },
  emptyArea: {
    height: BAR_MAX_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#B0A090',
  },
});
