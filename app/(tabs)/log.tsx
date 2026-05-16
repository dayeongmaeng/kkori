import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useFocusEffect } from 'expo-router';

const imgArrowLeft = require('../../assets/log/arrow-left.png');
const imgArrowRight = require('../../assets/log/arrow-right.png');
const imgCalendar = require('../../assets/log/calendar.png');

function HeaderIcon({
  source,
  fallback,
  tintColor,
  size = 18,
}: {
  source: number;
  fallback: string;
  tintColor: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <Text style={{ fontSize: size, color: tintColor, fontWeight: '500' }}>{fallback}</Text>;
  }
  return (
    <Image
      source={source}
      style={{ width: size, height: size }}
      tintColor={tintColor}
      onError={() => setFailed(true)}
      contentFit="contain"
    />
  );
}
import DatePickerModal from '../../components/DatePickerModal';
import EmptyPetState from '../../components/EmptyPetState';
import SaveIndicator from '../../components/SaveIndicator';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useMidnightRefresh } from '../../hooks/useMidnightRefresh';
import ConditionPicker from '../../components/ConditionPicker';
import MealPicker from '../../components/MealPicker';
import MemoInput from '../../components/MemoInput';
import PhotoAttacher from '../../components/PhotoAttacher';
import PoopPicker from '../../components/PoopPicker';
import WalkInput from '../../components/WalkInput';
import WaterPicker from '../../components/WaterPicker';
import { colors, radius, spacing } from '../../constants/theme';
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
  const [hasPet, setHasPet] = useState<boolean | null>(null);
  const [petId, setPetId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [date, setDate] = useState(getTodayString());
  const [reloadKey, setReloadKey] = useState(0);
  const isViewingTodayRef = useRef(true);
  const [existingLog, setExistingLog] = useState<DailyLog | null>(null);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [markedDates, setMarkedDates] = useState<Record<string, { marked: true; dotColor: string }>>({});

  // 자동저장 시 최신값 참조용 ref
  const petIdRef = useRef<string | null>(null);
  const dateRef = useRef(date);
  const existingLogRef = useRef<DailyLog | null>(null);
  petIdRef.current = petId;
  dateRef.current = date;
  existingLogRef.current = existingLog;

  const [condition, setCondition] = useState<ConditionScore | undefined>();
  const [meal, setMeal] = useState<MealAmount | undefined>();
  const [mealNote, setMealNote] = useState('');
  const [walkMinutes, setWalkMinutes] = useState<number | undefined>();
  const [walkNote, setWalkNote] = useState('');
  const [pooCondition, setPooCondition] = useState<StoolCondition | undefined>();
  const [urineColor, setUrineColor] = useState<UrineColor | undefined>();
  const [pooNote, setPooNote] = useState('');
  const [water, setWater] = useState<WaterAmount | undefined>();
  const [waterNote, setWaterNote] = useState('');
  const [memo, setMemo] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);

  function handleDateChange(newDate: string) {
    isViewingTodayRef.current = newDate === getTodayString();
    setDate(newDate);
    setReloadKey((k) => k + 1);
  }

  function resetStates() {
    setExistingLog(null);
    setCondition(undefined);
    setMeal(undefined);
    setMealNote('');
    setWalkMinutes(undefined);
    setWalkNote('');
    setPooCondition(undefined);
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
    setPooCondition(log.pooCondition);
    setUrineColor(log.urineColor);
    setPooNote(log.pooNote ?? '');
    setWater(log.water);
    setWaterNote(log.waterNote ?? '');
    setMemo(log.memo ?? '');
    setPhotoUris(log.photoUris ?? []);
  }

  useFocusEffect(
    useCallback(() => {
      async function loadLog() {
        setIsLoaded(false);
        const effectiveDate = isViewingTodayRef.current ? getTodayString() : dateRef.current;
        if (effectiveDate !== dateRef.current) setDate(effectiveDate);

        const currentPetId = await getCurrentPetId();
        if (!currentPetId) { setHasPet(false); resetStates(); setIsLoaded(true); return; }
        setPetId(currentPetId);
        setHasPet(true);

        const [log, allLogs] = await Promise.all([
          getDailyLogByDate(currentPetId, effectiveDate),
          getDailyLogs(currentPetId),
        ]);

        const marks: Record<string, { marked: true; dotColor: string }> = {};
        allLogs.forEach((l) => {
          marks[l.date] = { marked: true, dotColor: colors.accent };
        });
        setMarkedDates(marks);

        if (log) populateStates(log);
        else resetStates();
        setIsLoaded(true);
      }
      loadLog();
    }, [reloadKey])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (appState) => {
      if (appState !== 'active') return;
      if (isViewingTodayRef.current) {
        const freshToday = getTodayString();
        if (freshToday !== dateRef.current) setDate(freshToday);
      }
      setReloadKey((k) => k + 1);
    });
    return () => sub.remove();
  }, []);

  const handleMidnightRefresh = useCallback(() => {
    if (isViewingTodayRef.current) {
      const freshToday = getTodayString();
      if (freshToday !== dateRef.current) setDate(freshToday);
    }
    setReloadKey((k) => k + 1);
  }, []);

  useMidnightRefresh(handleMidnightRefresh);

  const logData = {
    condition, meal, mealNote, walkMinutes, walkNote,
    pooCondition, urineColor, pooNote,
    water, waterNote, memo, photoUris,
  };

  const autoSaveLog = useCallback(async (data: typeof logData) => {
    const currentPetId = petIdRef.current;
    if (!currentPetId) return;

    const now = new Date().toISOString();
    const log: DailyLog = {
      id: existingLogRef.current?.id ?? generateId(),
      petId: currentPetId,
      caregiverId: existingLogRef.current?.caregiverId ?? '',
      date: dateRef.current,
      condition: data.condition,
      meal: data.meal,
      mealNote: data.mealNote.trim() || undefined,
      walkMinutes: data.walkMinutes,
      walkNote: data.walkNote.trim() || undefined,
      pooCondition: data.pooCondition,
      pooNote: data.pooNote.trim() || undefined,
      urineColor: data.urineColor,
      water: data.water,
      waterNote: data.waterNote.trim() || undefined,
      memo: data.memo.trim() || undefined,
      photoUris: data.photoUris.length > 0 ? data.photoUris : undefined,
      createdAt: existingLogRef.current?.createdAt ?? now,
      updatedAt: now,
    };
    await saveDailyLog(log);
    if (!existingLogRef.current) setExistingLog(log);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { status: saveStatus, saveNow } = useAutoSave(
    logData,
    autoSaveLog,
    { enabled: isLoaded && hasPet === true }
  );

  const isToday = date === getTodayString();

  if (hasPet === false) {
    return (
      <View style={styles.container}>
        <EmptyPetState />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.arrowBtn} onPress={() => handleDateChange(addDays(date, -1))}>
          <HeaderIcon source={imgArrowLeft} fallback="<" tintColor={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setIsCalendarVisible(true)}>
          <Text style={styles.dateText}>{formatDateKorean(date)}</Text>
          <HeaderIcon source={imgCalendar} fallback="📅" tintColor={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.arrowBtn}
          onPress={() => handleDateChange(addDays(date, 1))}
          disabled={isToday}
        >
          <HeaderIcon
            source={imgArrowRight}
            fallback=">"
            tintColor={isToday ? colors.textTertiary : colors.primary}
          />
        </TouchableOpacity>
      </View>
      <SaveIndicator status={saveStatus} labels={{ saved: '저장되었습니다 ✓' }} />

      {/* 본문 */}
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
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
            pooCondition={pooCondition}
            urineColor={urineColor}
            pooNote={pooNote}
            onChangePooCondition={setPooCondition}
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
          onSelect={(d) => { handleDateChange(d); setIsCalendarVisible(false); }}
          onClose={() => setIsCalendarVisible(false)}
        />

      </KeyboardAwareScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={saveNow}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>저장</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  arrowBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
});
