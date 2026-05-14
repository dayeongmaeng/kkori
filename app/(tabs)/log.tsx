import { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import DatePickerModal from '../../components/DatePickerModal';
import ConditionPicker from '../../components/ConditionPicker';
import MealPicker from '../../components/MealPicker';
import MemoInput from '../../components/MemoInput';
import PhotoAttacher from '../../components/PhotoAttacher';
import PoopPicker from '../../components/PoopPicker';
import WalkInput from '../../components/WalkInput';
import WaterPicker from '../../components/WaterPicker';
import { getCurrentPetId, getDailyLogByDate, getDailyLogs, saveDailyLog } from '../../lib/storage';
import { ConditionScore, DailyLog, MealAmount, StoolCondition, UrineColor, WaterAmount } from '../../lib/types';

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateKorean(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

function addDays(dateStr: string, delta: number) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + delta);
  return date.toISOString().slice(0, 10);
}

function generateId() {
  return `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function Card({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function LogScreen() {
  const [date, setDate] = useState(getTodayString());
  const [existingLog, setExistingLog] = useState<DailyLog | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [markedDates, setMarkedDates] = useState<Record<string, { marked: true; dotColor: string }>>({});

  const [condition, setCondition] = useState<ConditionScore | undefined>();
  const [meal, setMeal] = useState<MealAmount | undefined>();
  const [mealNote, setMealNote] = useState('');
  const [walkMinutes, setWalkMinutes] = useState<number | undefined>();
  const [walkNote, setWalkNote] = useState('');
  const [pooCount, setPooCount] = useState<number | undefined>();
  const [pooCondition, setPooCondition] = useState<StoolCondition | undefined>();
  const [peeCount, setPeeCount] = useState<number | undefined>();
  const [urineColor, setUrineColor] = useState<UrineColor | undefined>();
  const [pooNote, setPooNote] = useState('');
  const [water, setWater] = useState<WaterAmount | undefined>();
  const [waterNote, setWaterNote] = useState('');
  const [memo, setMemo] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);

  function resetStates() {
    setExistingLog(null);
    setCondition(undefined);
    setMeal(undefined);
    setMealNote('');
    setWalkMinutes(undefined);
    setWalkNote('');
    setPooCount(undefined);
    setPooCondition(undefined);
    setPeeCount(undefined);
    setUrineColor(undefined);
    setPooNote('');
    setWater(undefined);
    setWaterNote('');
    setMemo('');
    setPhotoUris([]);
  }

  function populateStates(log: DailyLog) {
    setExistingLog(log);
    setCondition(log.condition);
    setMeal(log.meal);
    setMealNote(log.mealNote ?? '');
    setWalkMinutes(log.walkMinutes);
    setWalkNote(log.walkNote ?? '');
    setPooCount(log.pooCount);
    setPooCondition(log.pooCondition);
    setPeeCount(log.peeCount);
    setUrineColor(log.urineColor);
    setPooNote(log.pooNote ?? '');
    setWater(log.water);
    setWaterNote(log.waterNote ?? '');
    setMemo(log.memo ?? '');
    setPhotoUris(log.photoUris ?? []);
  }

  const loadLog = useCallback(async () => {
    const petId = await getCurrentPetId();
    if (!petId) { resetStates(); return; }

    const [log, allLogs] = await Promise.all([
      getDailyLogByDate(petId, date),
      getDailyLogs(petId),
    ]);

    const marks: Record<string, { marked: true; dotColor: string }> = {};
    allLogs.forEach((l) => {
      marks[l.date] = { marked: true, dotColor: '#E8985C' };
    });
    setMarkedDates(marks);

    if (log) {
      populateStates(log);
    } else {
      resetStates();
    }
  }, [date]);

  useFocusEffect(loadLog);

  async function handleSave() {
    setIsSaving(true);
    try {
      const petId = await getCurrentPetId();
      if (!petId) throw new Error('반려동물 정보가 없어요.');

      const now = new Date().toISOString();
      const log: DailyLog = {
        id: existingLog?.id ?? generateId(),
        petId,
        caregiverId: existingLog?.caregiverId ?? '',
        date,
        condition,
        meal,
        mealNote: mealNote.trim() || undefined,
        walkMinutes,
        walkNote: walkNote.trim() || undefined,
        pooCount,
        pooCondition,
        pooNote: pooNote.trim() || undefined,
        peeCount,
        urineColor,
        water,
        waterNote: waterNote.trim() || undefined,
        memo: memo.trim() || undefined,
        photoUris: photoUris.length > 0 ? photoUris : undefined,
        createdAt: existingLog?.createdAt ?? now,
        updatedAt: now,
      };

      await saveDailyLog(log);
      Alert.alert('저장됐어요 🐾');
    } catch {
      Alert.alert('저장에 실패했어요');
    } finally {
      setIsSaving(false);
    }
  }

  const isToday = date === getTodayString();

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.arrowBtn} onPress={() => setDate((d) => addDays(d, -1))}>
          <Text style={styles.arrowText}>{'<'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setIsCalendarVisible(true)}>
          <Text style={styles.dateText}>{formatDateKorean(date)}</Text>
          <Text style={styles.calendarIcon}>📅</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.arrowBtn}
          onPress={() => setDate((d) => addDays(d, 1))}
          disabled={isToday}
        >
          <Text style={[styles.arrowText, isToday && styles.arrowDisabled]}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* 본문 */}
      <ScrollView contentContainerStyle={styles.content}>
        <Card title="오늘 컨디션은?">
          <ConditionPicker value={condition} onChange={setCondition} />
        </Card>
        <Card title="식사는?">
          <MealPicker
            meal={meal}
            mealNote={mealNote}
            onChangeMeal={setMeal}
            onChangeNote={setMealNote}
          />
        </Card>
        <Card title="산책">
          <WalkInput
            minutes={walkMinutes}
            note={walkNote}
            onChangeMinutes={setWalkMinutes}
            onChangeNote={setWalkNote}
          />
        </Card>
        <Card title="배변">
          <PoopPicker
            pooCount={pooCount}
            pooCondition={pooCondition}
            peeCount={peeCount}
            urineColor={urineColor}
            pooNote={pooNote}
            onChangePooCount={setPooCount}
            onChangePooCondition={setPooCondition}
            onChangePeeCount={setPeeCount}
            onChangeUrineColor={setUrineColor}
            onChangePooNote={setPooNote}
          />
        </Card>
        <Card title="물 섭취">
          <WaterPicker
            water={water}
            waterNote={waterNote}
            onChangeWater={setWater}
            onChangeNote={setWaterNote}
          />
        </Card>
        <Card title="기록 사진 (선택)">
          <PhotoAttacher photoUris={photoUris} onChangePhotoUris={setPhotoUris} />
        </Card>
        <Card title="오늘의 메모">
          <MemoInput value={memo} onChangeText={setMemo} />
        </Card>

        {/* 날짜 캘린더 모달 */}
        <DatePickerModal
          visible={isCalendarVisible}
          selectedDate={date}
          markedDates={markedDates}
          onSelect={(d) => { setDate(d); setIsCalendarVisible(false); }}
          onClose={() => setIsCalendarVisible(false)}
        />

        {/* 하단 저장 버튼 */}
        <TouchableOpacity
          style={[styles.submitBtn, isSaving && styles.submitBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.submitBtnText}>{isSaving ? '저장 중…' : '저장'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAE0',
  },
  arrowBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 20,
    color: '#5C4A38',
    fontWeight: '500',
  },
  arrowDisabled: {
    color: '#C4B8A8',
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3D2C1E',
  },
  calendarIcon: {
    fontSize: 16,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D2C1E',
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: '#E8985C',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
