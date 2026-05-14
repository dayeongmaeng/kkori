import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
  },
  emptyCard: {
    backgroundColor: '#FFF4E8',
  },
  filledCard: {
    backgroundColor: '#FFFFFF',
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    fontSize: 28,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  mainText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3D2C1E',
  },
  subText: {
    fontSize: 13,
    color: '#8C7B6B',
  },
  addButton: {
    backgroundColor: '#E8985C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chevron: {
    fontSize: 22,
    color: '#B0A090',
    lineHeight: 26,
  },
});
