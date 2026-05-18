import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useFocusEffect } from 'expo-router';
import DatePickerModal from '../../components/DatePickerModal';
import EmptyPetState from '../../components/EmptyPetState';
import SaveIndicator from '../../components/SaveIndicator';
import { useDate } from '../../contexts/DateContext';
import ConditionPicker from '../../components/ConditionPicker';
import MealPicker from '../../components/MealPicker';
import MemoInput from '../../components/MemoInput';
import PhotoAttacher from '../../components/PhotoAttacher';
import type { LogPhotoAttachment } from '../../components/PhotoAttacher';
import PoopPicker from '../../components/PoopPicker';
import WalkInput from '../../components/WalkInput';
import WaterPicker from '../../components/WaterPicker';
import { colors, radius, spacing } from '../../constants/theme';
import {
  LogRequest,
  LogPhotoResponse,
  LogResponse,
  logApi,
} from '../../lib/api/log';
import { getCachedCurrentCaregiverId } from '../../lib/cache/caregiver';
import { getCachedCurrentPetId } from '../../lib/cache/pet';
import {
  getCachedLogByDate,
  getCachedLogs,
  getLogLocalExtras,
  getLogPhotos,
  removeCachedLog,
  setCachedLogs,
  setLogLocalExtras,
  setLogPhotos,
  upsertCachedLog,
} from '../../lib/cache/log';
import { ConditionScore, MealAmount, StoolCondition, UrineColor, WaterAmount } from '../../lib/types';

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

type LogSaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type LogFormData = {
  date: string;
  logExternalId: string | null;
  condition: ConditionScore | undefined;
  meal: MealAmount | undefined;
  mealNote: string;
  walkMinutes: number | undefined;
  walkNote: string;
  pooCondition: StoolCondition | undefined;
  urineColor: UrineColor | undefined;
  pooNote: string;
  water: WaterAmount | undefined;
  waterNote: string;
  memo: string;
};

function formatDateKorean(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

function addDays(dateStr: string, delta: number) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + delta);
  return date.toISOString().slice(0, 10);
}


function buildMarkedDates(logs: LogResponse[]): Record<string, { marked: true; dotColor: string }> {
  const marks: Record<string, { marked: true; dotColor: string }> = {};
  logs.forEach((l) => { marks[l.date] = { marked: true, dotColor: colors.accent }; });
  return marks;
}

function Card({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function toReadyLogPhotos(photos: LogPhotoAttachment[]): LogPhotoResponse[] {
  return photos
    .filter((photo) => photo.status !== 'uploading' && photo.status !== 'error' && !photo.tempId)
    .map((photo) => ({
      externalId: photo.externalId,
      dailyLogId: photo.dailyLogId,
      petId: photo.petId,
      caregiverId: photo.caregiverId,
      date: photo.date,
      mediumUrl: photo.mediumUrl,
      thumbnailUrl: photo.thumbnailUrl,
      sortOrder: photo.sortOrder,
      createdAt: photo.createdAt,
      updatedAt: photo.updatedAt,
    }));
}

function toEditableWalkMinutes(value: number | null | undefined): number | undefined {
  return value == null ? undefined : value;
}

export default function LogScreen() {
  const today = useDate();

  const [hasPet, setHasPet] = useState<boolean | null>(null);
  const [petId, setPetId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [date, setDate] = useState(today);
  const [reloadKey, setReloadKey] = useState(0);
  const isViewingTodayRef = useRef(true);
  const [logExternalId, setLogExternalId] = useState<string | null>(null);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [markedDates, setMarkedDates] = useState<Record<string, { marked: true; dotColor: string }>>({});
  const loadSeqRef = useRef(0);

  const petIdRef = useRef<string | null>(null);
  const dateRef = useRef(date);
  const logExternalIdRef = useRef<string | null>(null);
  const logPhotosRef = useRef<LogPhotoAttachment[]>([]);
  petIdRef.current = petId;
  dateRef.current = date;
  logExternalIdRef.current = logExternalId;

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
  const [logPhotos, setLogPhotosState] = useState<LogPhotoAttachment[]>([]);
  logPhotosRef.current = logPhotos;
  const [saveStatus, setSaveStatus] = useState<LogSaveStatus>('idle');
  const [successMessage, setSuccessMessage] = useState('저장되었습니다 ✓');
  const [successBgColor, setSuccessBgColor] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleDateChange(newDate: string) {
    if (isSaving || isDeleting || !isLoaded) return;
    isViewingTodayRef.current = newDate === today;
    setIsLoaded(false);
    setDate(newDate);
    setSaveStatus('idle');
    setReloadKey((k) => k + 1);
  }

  function resetStates() {
    setLogExternalId(null);
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
    setLogPhotosState([]);
  }

  async function applyLog(log: LogResponse) {
    setLogExternalId(log.externalId);
    logExternalIdRef.current = log.externalId;

    setCondition(log.condition);
    setMeal(log.meal);
    setWalkMinutes(toEditableWalkMinutes(log.walkMinutes));
    setPooCondition(log.pooCondition);
    setUrineColor(log.urineColor);
    setWater(log.water);
    setMemo(log.memo ?? '');

    const extras = await getLogLocalExtras(log.externalId);
    setMealNote(extras.mealNote ?? '');
    setWalkNote(extras.walkNote ?? '');
    setPooNote(extras.pooNote ?? '');
    setWaterNote(extras.waterNote ?? '');

    const cachedPhotos = await getLogPhotos(log.externalId);
    const serverPhotos = log.photos ?? [];
    const photos = serverPhotos.length > 0 ? serverPhotos : cachedPhotos;
    setLogPhotosState(photos.map((photo) => ({ ...photo, status: 'ready' as const })));
  }

  useFocusEffect(
    useCallback(() => {
      async function loadLog() {
        const seq = ++loadSeqRef.current;
        setIsLoaded(false);
        const effectiveDate = isViewingTodayRef.current ? today : dateRef.current;
        if (effectiveDate !== dateRef.current) setDate(effectiveDate);

        const currentPetId = await getCachedCurrentPetId();
        if (seq !== loadSeqRef.current) return;
        if (!currentPetId) { setHasPet(false); resetStates(); setIsLoaded(true); return; }
        setPetId(currentPetId);
        setHasPet(true);

        const [cachedLog, cachedLogs] = await Promise.all([
          getCachedLogByDate(currentPetId, effectiveDate),
          getCachedLogs(currentPetId),
        ]);

        setMarkedDates(buildMarkedDates(cachedLogs));

        if (cachedLog) {
          await applyLog(cachedLog);
        } else {
          resetStates();
        }
        if (seq !== loadSeqRef.current) return;
        setIsLoaded(true);

        try {
          const serverLogs = await logApi.getLogs({ petExternalId: currentPetId });
          if (seq !== loadSeqRef.current) return;
          await setCachedLogs(currentPetId, serverLogs);
          setMarkedDates(buildMarkedDates(serverLogs));

          const serverLog = serverLogs.find((l) => l.date === effectiveDate);
          if (serverLog) {
            await upsertCachedLog(currentPetId, serverLog);
            await applyLog(serverLog);
          } else {
            resetStates();
          }
        } catch {
          // 오프라인 — 캐시 유지
        }
      }
      loadLog();
    // today가 바뀌면(자정) 새 날짜 기준으로 재로드
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reloadKey, today])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') setReloadKey((k) => k + 1);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    return () => {
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    };
  }, []);

  const logData: LogFormData = {
    date,
    logExternalId,
    condition, meal, mealNote, walkMinutes, walkNote,
    pooCondition, urineColor, pooNote,
    water, waterNote, memo,
  };

  const saveLog = useCallback(async (data: LogFormData): Promise<string | null> => {
    const currentPetId = petIdRef.current;
    if (!currentPetId) return null;

    const caregiverId = await getCachedCurrentCaregiverId();
    if (!caregiverId) throw new Error('보호자 정보가 초기화되지 않았습니다.');

    const body: LogRequest = {
      petExternalId: currentPetId,
      caregiverExternalId: caregiverId,
      date: data.date,
      meal: data.meal,
      water: data.water,
      walkMinutes: data.walkMinutes ?? null,
      pooCondition: data.pooCondition,
      urineColor: data.urineColor,
      condition: data.condition,
      memo: data.memo.trim() || undefined,
    };

    const extId = data.logExternalId;
    let savedExtId = extId;

    if (extId) {
      console.log('[LogSave] updateLog payload:', JSON.stringify(body, null, 2));
      const result = await logApi.updateLog(extId, body);
      if (result) {
        const photos = result.photos?.length ? result.photos : toReadyLogPhotos(logPhotosRef.current);
        await upsertCachedLog(currentPetId, { ...result, photos });
      }
    } else {
      console.log('[LogSave] createLog payload:', JSON.stringify(body, null, 2));
      const result = await logApi.createLog(body);
      savedExtId = result.externalId;
      if (dateRef.current === data.date) {
        setLogExternalId(savedExtId);
        logExternalIdRef.current = savedExtId;
      }
      const photos = result.photos?.length ? result.photos : toReadyLogPhotos(logPhotosRef.current);
      await upsertCachedLog(currentPetId, { ...result, photos });
    }

    if (savedExtId) {
      await setLogLocalExtras(savedExtId, {
        mealNote: data.mealNote.trim() || undefined,
        walkNote: data.walkNote.trim() || undefined,
        pooNote: data.pooNote.trim() || undefined,
        waterNote: data.waterNote.trim() || undefined,
      });
    }

    return savedExtId;
  }, []);

  async function handleSave() {
    if (!isLoaded || hasPet !== true || isSaving || isDeleting) return;

    if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    setSaveStatus('saving');
    setIsSaving(true);

    try {
      await saveLog(logData);
      setSuccessMessage('저장되었습니다 ✓');
      setSuccessBgColor(undefined);
      setSaveStatus('saved');
      saveStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }

  async function persistLogPhotos(nextPhotos: LogPhotoAttachment[]) {
    const currentPetId = petIdRef.current;
    const currentLogExternalId = logExternalIdRef.current;
    if (!currentPetId || !currentLogExternalId) return;

    const readyPhotos = toReadyLogPhotos(nextPhotos);
    await setLogPhotos(currentLogExternalId, readyPhotos);

    const cachedLog = await getCachedLogByDate(currentPetId, dateRef.current);
    if (cachedLog) {
      await upsertCachedLog(currentPetId, { ...cachedLog, photos: readyPhotos });
    }
  }

  async function ensureLogExternalIdForPhoto() {
    if (logExternalIdRef.current) return logExternalIdRef.current;
    if (!isLoaded || hasPet !== true || isSaving || isDeleting) return null;

    if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    setSaveStatus('saving');
    setIsSaving(true);

    try {
      const savedId = await saveLog({
        date: dateRef.current,
        logExternalId: logExternalIdRef.current,
        condition,
        meal,
        mealNote,
        walkMinutes,
        walkNote,
        pooCondition,
        urineColor,
        pooNote,
        water,
        waterNote,
        memo,
      });
      setSuccessMessage('기록을 먼저 저장했어요 ✓');
      setSuccessBgColor(undefined);
      setSaveStatus('saved');
      saveStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
      return savedId;
    } catch {
      setSaveStatus('error');
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  function confirmDelete() {
    if (!logExternalId || !petId || isDeleting || isSaving) return;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${formatDateKorean(date)} 기록을 삭제할까요?`);
      if (confirmed) {
        void handleDelete();
      }
      return;
    }

    Alert.alert(
      '기록을 삭제할까요?',
      `${formatDateKorean(date)} 기록이 사라져요.`,
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: handleDelete },
      ],
    );
  }

  async function handleDelete() {
    const currentPetId = petIdRef.current;
    const currentLogExternalId = logExternalIdRef.current;
    const currentDate = dateRef.current;
    if (!currentPetId || !currentLogExternalId || isDeleting) return;

    setIsDeleting(true);
    setSaveStatus('saving');
    try {
      await logApi.deleteLog(currentLogExternalId);
      await removeCachedLog(currentPetId, currentLogExternalId, currentDate);
      resetStates();
      setMarkedDates(buildMarkedDates(await getCachedLogs(currentPetId)));
      setSuccessMessage('삭제되었습니다 ✓');
      setSuccessBgColor('rgba(233,75,90,0.88)');
      setSaveStatus('saved');
      saveStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      Alert.alert('삭제 실패', '기록을 삭제하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsDeleting(false);
    }
  }

  const isToday = date === today;
  const isBusy = isSaving || isDeleting || !isLoaded;
  const hasLog = Boolean(logExternalId);

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
        <TouchableOpacity style={styles.arrowBtn} onPress={() => handleDateChange(addDays(date, -1))} disabled={isBusy}>
          <HeaderIcon source={imgArrowLeft} fallback="<" tintColor={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setIsCalendarVisible(true)} disabled={isBusy}>
          <Text style={styles.dateText}>{formatDateKorean(date)}</Text>
          <HeaderIcon source={imgCalendar} fallback="📅" tintColor={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.arrowBtn}
          onPress={() => handleDateChange(addDays(date, 1))}
          disabled={isToday || isBusy}
        >
          <HeaderIcon
            source={imgArrowRight}
            fallback=">"
            tintColor={isToday ? colors.textTertiary : colors.primary}
          />
        </TouchableOpacity>
      </View>
      {!isToday && (
        <View style={styles.pastDateNotice}>
          <Text style={styles.pastDateNoticeText}>지난 날짜의 기록을 보고 있어요</Text>
        </View>
      )}
      <SaveIndicator
        status={saveStatus}
        labels={{ saved: successMessage }}
        backgroundColors={{ saved: successBgColor }}
      />

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
          <PhotoAttacher
            photos={logPhotos}
            disabled={isBusy}
            onChangePhotos={setLogPhotosState}
            onEnsureLogExternalId={ensureLogExternalIdForPhoto}
            onUploaded={persistLogPhotos}
          />
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
          style={[styles.saveBtn, isBusy && styles.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={isBusy}
        >
          <Text style={styles.saveBtnText}>{isSaving ? '저장 중...' : '저장'}</Text>
        </TouchableOpacity>
        {hasLog && (
          <TouchableOpacity
            style={[styles.deleteBtn, (isSaving || isDeleting) && styles.deleteBtnDisabled]}
            onPress={confirmDelete}
            activeOpacity={0.8}
            disabled={isSaving || isDeleting}
          >
            <Text style={styles.deleteBtnText}>{isDeleting ? '삭제 중...' : '기록 삭제'}</Text>
          </TouchableOpacity>
        )}
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
  pastDateNotice: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.background,
  },
  pastDateNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
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
    gap: spacing.sm,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  deleteBtn: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteBtnDisabled: {
    opacity: 0.5,
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.danger,
  },
});
