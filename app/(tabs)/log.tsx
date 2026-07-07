import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useFocusEffect } from 'expo-router';
import DatePickerModal from '../../components/DatePickerModal';
import EmptyPetState from '../../components/EmptyPetState';
import FeatureHintModal from '../../components/FeatureHintModal';
import SaveIndicator from '../../components/SaveIndicator';
import { useDate } from '../../contexts/DateContext';
import CatToiletPicker from '../../components/CatToiletPicker';
import ConditionPicker from '../../components/ConditionPicker';
import MealPicker from '../../components/MealPicker';
import MemoInput from '../../components/MemoInput';
import PhotoAttacher from '../../components/PhotoAttacher';
import type { LogPhotoAttachment } from '../../components/PhotoAttacher';
import PlayInput from '../../components/PlayInput';
import PoopPicker from '../../components/PoopPicker';
import VomitInput from '../../components/VomitInput';
import WalkInput from '../../components/WalkInput';
import WaterPicker from '../../components/WaterPicker';
import { colors, radius, spacing } from '../../constants/theme';
import { showAlert } from '../../lib/dialog';
import {
  LogRequest,
  LogPhotoResponse,
  LogResponse,
  logApi,
} from '../../lib/api/log';
import { ApiError } from '../../lib/api/types';
import { logger, toLogError } from '../../lib/logger';
import { initCaregiver } from '../../lib/api/initCaregiver';
import { getCachedCurrentCaregiverId } from '../../lib/cache/caregiver';
import { getCachedCurrentPetId } from '../../lib/cache/pet';
import { useCurrentPet } from '../../contexts/PetContext';
import {
  getCachedLogByDate,
  getCachedLogs,
  getLogLocalExtras,
  getLogPhotos,
  removeCachedLog,
  setCachedLogs,
  setLogPhotos,
  upsertCachedLog,
} from '../../lib/cache/log';
import { ConditionScore, MealAmount, StoolCondition, UrineAmount, UrineColor, WaterAmount } from '../../lib/types';
import { showConfirm } from '../../lib/dialog';

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
  urineNote: string;
  pooNote: string;
  water: WaterAmount | undefined;
  waterNote: string;
  playMinutes: number | undefined;
  playNote: string;
  urineAmount: UrineAmount | undefined;
  vomitCount: number | undefined;
  vomitNote: string;
  weightKg: string;
  memo: string;
};

function formatDateKorean(dateStr: string) {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
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
    .filter((photo) => !photo.tempId)
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

// 저장 시 업로드한 로컬(임시) 사진을 서버 응답과 tempId 기준으로 매칭한다.
function mapPendingPhotosById(
  pending: LogPhotoAttachment[],
  uploaded: LogPhotoResponse[],
): Map<string, LogPhotoResponse> {
  const map = new Map<string, LogPhotoResponse>();
  pending.forEach((photo, i) => {
    if (photo.tempId && uploaded[i]) map.set(photo.tempId, uploaded[i]);
  });
  return map;
}

function replaceTempPhotos(
  photos: LogPhotoAttachment[],
  uploadedByTempId: Map<string, LogPhotoResponse>,
): LogPhotoAttachment[] {
  return photos.map((photo) => {
    const uploaded = photo.tempId ? uploadedByTempId.get(photo.tempId) : undefined;
    return uploaded ? { ...uploaded, status: 'ready' as const } : photo;
  });
}

function getSaveErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.error.code) {
      case 'VALIDATION_001':
        return '사진은 최대 3장까지 첨부할 수 있어요.';
      case 'LOG_PHOTO_002':
        return '사진 파일이 올바르지 않아요. 사진을 다시 선택한 뒤 저장해주세요.';
      default:
        break;
    }
  }
  return '저장에 실패했어요. 잠시 후 다시 시도해주세요.';
}

export default function LogScreen() {
  const today = useDate();
  const { currentPet } = useCurrentPet();
  const petIdFromContext = currentPet?.externalId ?? null;

  const [isLoaded, setIsLoaded] = useState(false);
  const hasPet = petIdFromContext !== null;
  const [showHint, setShowHint] = useState(false);
  const [date, setDate] = useState(today);
  const [reloadKey, setReloadKey] = useState(0);
  const isViewingTodayRef = useRef(true);
  const [logExternalId, setLogExternalId] = useState<string | null>(null);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [markedDates, setMarkedDates] = useState<Record<string, { marked: true; dotColor: string }>>({});
  const loadSeqRef = useRef(0);

  const petIdFromContextRef = useRef<string | null>(petIdFromContext);
  petIdFromContextRef.current = petIdFromContext;
  const dateRef = useRef(date);
  const logExternalIdRef = useRef<string | null>(null);
  const logPhotosRef = useRef<LogPhotoAttachment[]>([]);
  dateRef.current = date;
  logExternalIdRef.current = logExternalId;
  // 사진 피커(카메라/갤러리)가 열려있는 동안, 그리고 닫힌 직후 잠시 발생하는
  // AppState active 전환은 리로드 트리거에서 제외하기 위한 플래그
  const isPhotoPickerOpenRef = useRef(false);
  const photoPickerCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [condition, setCondition] = useState<ConditionScore | undefined>();
  const [meal, setMeal] = useState<MealAmount | undefined>();
  const [mealNote, setMealNote] = useState('');
  const [walkMinutes, setWalkMinutes] = useState<number | undefined>();
  const [walkNote, setWalkNote] = useState('');
  const [pooCondition, setPooCondition] = useState<StoolCondition | undefined>();
  const [urineColor, setUrineColor] = useState<UrineColor | undefined>();
  const [urineNote, setUrineNote] = useState('');
  const [pooNote, setPooNote] = useState('');
  const [water, setWater] = useState<WaterAmount | undefined>();
  const [waterNote, setWaterNote] = useState('');
  const [playMinutes, setPlayMinutes] = useState<number | undefined>();
  const [playNote, setPlayNote] = useState('');
  const [urineAmount, setUrineAmount] = useState<UrineAmount | undefined>();
  const [vomitCount, setVomitCount] = useState<number | undefined>();
  const [vomitNote, setVomitNote] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [memo, setMemo] = useState('');
  const [logPhotos, setLogPhotosState] = useState<LogPhotoAttachment[]>([]);
  logPhotosRef.current = logPhotos;
  const [saveStatus, setSaveStatus] = useState<LogSaveStatus>('idle');
  const [successMessage, setSuccessMessage] = useState('저장되었습니다 ✓');
  const [successBgColor, setSuccessBgColor] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const footerAnim = useRef(new Animated.Value(0)).current;
  const footerHeightRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const footerVisibleRef = useRef(true);

  function handleDateChange(newDate: string) {
    if (isSaving || isDeleting || !isLoaded) return;
    isViewingTodayRef.current = newDate === today;
    setIsLoaded(false);
    setDate(newDate);
    setSaveStatus('idle');
    setReloadKey((k) => k + 1);
  }

  const isCat = currentPet?.species?.toLowerCase() === 'cat';

  function resetStates() {
    setLogExternalId(null);
    setCondition(undefined);
    setMeal(undefined);
    setMealNote('');
    setWalkMinutes(undefined);
    setWalkNote('');
    setPooCondition(undefined);
    setUrineColor(undefined);
    setUrineNote('');
    setPooNote('');
    setWater(undefined);
    setWaterNote('');
    setPlayMinutes(undefined);
    setPlayNote('');
    setUrineAmount(undefined);
    setVomitCount(undefined);
    setVomitNote('');
    setWeightKg('');
    setMemo('');
    setLogPhotosState([]);
  }

  async function applyLog(log: LogResponse, seq: number) {
    if (seq !== loadSeqRef.current) return;
    setLogExternalId(log.externalId);
    logExternalIdRef.current = log.externalId;

    setCondition(log.condition);
    setMeal(log.meal);
    setWalkMinutes(toEditableWalkMinutes(log.walkMinutes));
    setPooCondition(log.pooCondition);
    setUrineColor(log.urineColor);
    setWater(log.water);
    setPlayMinutes(log.playMinutes ?? undefined);
    setUrineAmount(log.urineAmount);
    setVomitCount(log.vomitCount);
    setVomitNote(log.vomitNote ?? '');
    setPlayNote(log.playNote ?? '');
    setUrineNote(log.urineNote ?? '');
    setWeightKg(log.weightKg !== undefined ? String(log.weightKg) : '');
    setMemo(log.memo ?? '');

    // API 필드로 이관된 메모들은 서버 값 우선, 이전 로컬 extras는 폴백
    const extras = await getLogLocalExtras(log.externalId);
    if (seq !== loadSeqRef.current) return;
    setMealNote(log.mealNote ?? extras.mealNote ?? '');
    setWalkNote(log.walkNote ?? extras.walkNote ?? '');
    setPooNote(log.pooNote ?? extras.pooNote ?? '');
    setWaterNote(log.waterNote ?? extras.waterNote ?? '');

    const cachedPhotos = await getLogPhotos(log.externalId);
    if (seq !== loadSeqRef.current) return;
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

        const currentPetId = petIdFromContext;
        if (seq !== loadSeqRef.current) return;
        if (!currentPetId) { resetStates(); setIsLoaded(true); return; }

        const [cachedLog, cachedLogs] = await Promise.all([
          getCachedLogByDate(currentPetId, effectiveDate),
          getCachedLogs(currentPetId),
        ]);

        if (seq !== loadSeqRef.current) return;
        setMarkedDates(buildMarkedDates(cachedLogs));

        if (cachedLog) {
          await applyLog(cachedLog, seq);
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
            await applyLog(serverLog, seq);
          } else if (seq === loadSeqRef.current) {
            resetStates();
          }
        } catch {
          // 오프라인 — 캐시 유지
        }
      }
      loadLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reloadKey, today, petIdFromContext])
  );

  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem('pet-care:hint:log')
      .then((val) => { if (!val) setShowHint(true); })
      .catch(() => {});
  }, []));

  function handleHintClose() {
    setShowHint(false);
    AsyncStorage.setItem('pet-care:hint:log', '1').catch(() => {});
  }

  function handlePhotoPickerVisibleChange(visible: boolean) {
    if (photoPickerCloseTimerRef.current) {
      clearTimeout(photoPickerCloseTimerRef.current);
      photoPickerCloseTimerRef.current = null;
    }
    if (visible) {
      isPhotoPickerOpenRef.current = true;
      return;
    }
    // 피커가 닫힌 직후에도 AppState 'active' 이벤트가 뒤이어 들어올 수 있어 잠시 유지 후 해제
    photoPickerCloseTimerRef.current = setTimeout(() => {
      isPhotoPickerOpenRef.current = false;
    }, 1000);
  }

  useEffect(() => {
    const sub = AppState.addEventListener('change', (appState) => {
      if (appState === 'active' && !isPhotoPickerOpenRef.current) setReloadKey((k) => k + 1);
    });
    return () => {
      sub.remove();
      if (photoPickerCloseTimerRef.current) clearTimeout(photoPickerCloseTimerRef.current);
    };
  }, []);

  // 반려동물 전환 시 이전 데이터 즉시 클리어 + 오늘 날짜로 초기화
  const isMountedRef = useRef(false);
  useEffect(() => {
    if (!isMountedRef.current) { isMountedRef.current = true; return; }
    isViewingTodayRef.current = true;
    setDate(today);
    resetStates();
    setIsLoaded(false);
    setMarkedDates({});
    setSaveStatus('idle');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petIdFromContext]);

  useEffect(() => {
    return () => {
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    };
  }, []);

  const logData: LogFormData = {
    date,
    logExternalId,
    condition, meal, mealNote, walkMinutes, walkNote,
    pooCondition, urineColor, urineNote, pooNote,
    water, waterNote,
    playMinutes, playNote, urineAmount: isCat ? (urineAmount ?? 'NONE') : undefined,
    vomitCount, vomitNote,
    weightKg,
    memo,
  };

  const saveLog = useCallback(async (data: LogFormData): Promise<string | null> => {
    const currentPetId = petIdFromContextRef.current;
    if (!currentPetId) return null;

    let caregiverId = await getCachedCurrentCaregiverId();
    if (!caregiverId) {
      await initCaregiver();
      caregiverId = await getCachedCurrentCaregiverId();
    }
    if (!caregiverId) throw new Error('보호자 정보가 초기화되지 않았습니다.');

    const parsedWeight = parseFloat(data.weightKg);
    const body: LogRequest = {
      petExternalId: currentPetId,
      caregiverExternalId: caregiverId,
      date: data.date,
      meal: data.meal,
      mealNote: data.mealNote.trim() || undefined,
      water: data.water,
      waterNote: data.waterNote.trim() || undefined,
      walkMinutes: data.walkMinutes ?? null,
      walkNote: data.walkNote.trim() || undefined,
      pooCondition: data.pooCondition,
      pooNote: data.pooNote.trim() || undefined,
      urineColor: data.urineColor,
      urineNote: data.urineNote.trim() || undefined,
      urineAmount: data.urineAmount,
      condition: data.condition,
      weightKg: data.weightKg.trim() && !isNaN(parsedWeight) && parsedWeight > 0 ? parsedWeight : undefined,
      memo: data.memo.trim() || undefined,
      playMinutes: data.playMinutes ?? null,
      playNote: data.playNote.trim() || undefined,
      vomitCount: data.vomitCount,
      vomitNote: data.vomitNote.trim() || undefined,
    };

    const extId = data.logExternalId;
    let savedExtId = extId;

    // 아직 서버에 업로드되지 않은, 로컬 준비가 끝난 사진들 (저장 시점에 함께 업로드)
    const pendingPhotos = logPhotosRef.current.filter(
      (photo) => photo.tempId && photo.status === 'local' && photo.mediumFile && photo.thumbnailFile,
    );

    if (extId) {
      logger.debug('log.save.update', { logExternalId: extId, date: data.date });
      const result = await logApi.updateLog(extId, body);

      for (const photo of pendingPhotos) {
        const uploaded = await logApi.uploadLogPhoto(extId, photo.mediumFile!, photo.thumbnailFile!);
        // 개별 업로드가 끝날 때마다 즉시 반영해 중간에 실패해도 이미 성공한 사진은 재업로드되지 않도록 한다
        const partial = replaceTempPhotos(logPhotosRef.current, mapPendingPhotosById([photo], [uploaded]));
        setLogPhotosState(partial);
        logPhotosRef.current = partial;
      }

      const finalPhotos = toReadyLogPhotos(logPhotosRef.current);
      if (result) {
        await upsertCachedLog(currentPetId, { ...result, photos: finalPhotos });
      }
    } else {
      logger.debug('log.save.create', { date: data.date, photoCount: pendingPhotos.length });
      const result = await logApi.createLogWithPhotos(
        body,
        pendingPhotos.map((photo) => ({ medium: photo.mediumFile!, thumbnail: photo.thumbnailFile! })),
      );
      savedExtId = result.externalId;
      if (dateRef.current === data.date) {
        setLogExternalId(savedExtId);
        logExternalIdRef.current = savedExtId;
      }

      const uploadedMap = mapPendingPhotosById(pendingPhotos, result.photos ?? []);
      const updatedPhotos = replaceTempPhotos(logPhotosRef.current, uploadedMap);
      setLogPhotosState(updatedPhotos);
      logPhotosRef.current = updatedPhotos;

      await upsertCachedLog(currentPetId, { ...result, photos: toReadyLogPhotos(updatedPhotos) });
    }

    return savedExtId;
  }, []);

  function showFooter() {
    footerVisibleRef.current = true;
    Animated.timing(footerAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start();
  }
  function hideFooter() {
    footerVisibleRef.current = false;
    Animated.timing(footerAnim, { toValue: footerHeightRef.current, duration: 220, useNativeDriver: true }).start();
  }
  const BOTTOM_THRESHOLD = 40;
  function isAtEdge(y: number, contentHeight: number, layoutHeight: number) {
    return y <= 0 || y + layoutHeight >= contentHeight - BOTTOM_THRESHOLD;
  }
  function handleScroll(e: any) {
    const y: number = e.nativeEvent.contentOffset.y;
    const contentHeight: number = e.nativeEvent.contentSize.height;
    const layoutHeight: number = e.nativeEvent.layoutMeasurement.height;
    const dy = y - lastScrollYRef.current;
    lastScrollYRef.current = y;
    if (isAtEdge(y, contentHeight, layoutHeight)) {
      if (!footerVisibleRef.current) showFooter();
      return;
    }
    if (dy > 3 && footerVisibleRef.current) hideFooter();
    else if (dy < -3 && !footerVisibleRef.current) showFooter();
  }
  function handleScrollEnd(e: any) {
    const y: number = e.nativeEvent.contentOffset.y;
    const contentHeight: number = e.nativeEvent.contentSize.height;
    const layoutHeight: number = e.nativeEvent.layoutMeasurement.height;
    if (isAtEdge(y, contentHeight, layoutHeight) && !footerVisibleRef.current) showFooter();
  }

  async function handleSave() {
    if (!isLoaded || hasPet !== true || isSaving || isDeleting) return;
    if (logPhotos.some((photo) => photo.status === 'compressing')) return;

    if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    setSaveStatus('saving');
    setIsSaving(true);

    try {
      await saveLog(logData);
      setSuccessMessage('저장되었습니다 ✓');
      setSuccessBgColor(undefined);
      setSaveStatus('saved');
      saveStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      logger.error('log.save.failed', toLogError(err));
      setErrorMessage(getSaveErrorMessage(err));
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }

  // 이미 서버에 저장된 사진을 PhotoAttacher에서 즉시 삭제한 뒤 캐시를 동기화한다.
  async function handlePhotoRemoved(nextPhotos: LogPhotoAttachment[]) {
    const currentPetId = petIdFromContextRef.current;
    const currentLogExternalId = logExternalIdRef.current;
    if (!currentPetId || !currentLogExternalId) return;

    const readyPhotos = toReadyLogPhotos(nextPhotos);
    await setLogPhotos(currentLogExternalId, readyPhotos);

    const cachedLog = await getCachedLogByDate(currentPetId, dateRef.current);
    if (cachedLog) {
      await upsertCachedLog(currentPetId, { ...cachedLog, photos: readyPhotos });
    }
  }

  function confirmDelete() {
    if (!logExternalId || !petIdFromContextRef.current || isDeleting || isSaving) return;
    showConfirm(
      '기록을 삭제할까요?',
      `${formatDateKorean(date)} 기록이 사라져요.`,
      handleDelete,
      { confirmText: '삭제', confirmStyle: 'destructive' },
    );
  }

  async function handleDelete() {
    const currentPetId = petIdFromContextRef.current;
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
      setSuccessBgColor('rgba(214,106,106,0.88)');
      setSaveStatus('saved');
      saveStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
      showAlert('삭제 실패', '기록을 삭제하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsDeleting(false);
    }
  }

  const isToday = date === today;
  const isPhotoPreparing = logPhotos.some((photo) => photo.status === 'compressing');
  const isBusy = isSaving || isDeleting || !isLoaded || isPhotoPreparing;
  const hasLog = Boolean(logExternalId);

  const logHint = (
    <FeatureHintModal
      visible={showHint}
      title="기록하기"
      body={'식사, 산책, 배변, 건강 상태를 기록해보세요.\n작은 변화도 나중에는 중요한 기록이 됩니다.'}
      onClose={handleHintClose}
    />
  );

  if (!hasPet) {
    return (
      <View style={styles.container}>
        <EmptyPetState />
        {logHint}
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
        labels={{ saved: successMessage, error: errorMessage }}
        backgroundColors={{ saved: successBgColor }}
        centered
      />

      {/* 본문 */}
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
        enableResetScrollToCoords={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
      >
        <Card title="오늘 컨디션은?">
          <ConditionPicker value={condition} onChange={setCondition} iconSet={isCat ? 'cat' : 'dog'} />
        </Card>
        <Card title="식사는?">
          <MealPicker
            meal={meal}
            mealNote={mealNote}
            onChangeMeal={setMeal}
            onChangeNote={setMealNote}
          />
        </Card>

        {/* 강아지 전용 */}
        {!isCat && (
          <>
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
                urineNote={urineNote}
                onChangePooCondition={setPooCondition}
                onChangeUrineColor={setUrineColor}
                onChangePooNote={setPooNote}
                onChangeUrineNote={setUrineNote}
              />
            </Card>
          </>
        )}

        {/* 고양이 전용 */}
        {isCat && (
          <>
            <Card title="놀이">
              <PlayInput
                minutes={playMinutes}
                note={playNote}
                onChangeMinutes={setPlayMinutes}
                onChangeNote={setPlayNote}
              />
            </Card>
            <Card title="화장실">
              <CatToiletPicker
                pooCondition={pooCondition}
                pooNote={pooNote}
                urineAmount={urineAmount}
                urineNote={urineNote}
                onChangePooCondition={setPooCondition}
                onChangePooNote={setPooNote}
                onChangeUrineAmount={setUrineAmount}
                onChangeUrineNote={setUrineNote}
              />
            </Card>
          </>
        )}

        <Card title="물 섭취">
          <WaterPicker
            water={water}
            waterNote={waterNote}
            onChangeWater={setWater}
            onChangeNote={setWaterNote}
          />
        </Card>
        <Card title="구토">
          <VomitInput
            count={vomitCount}
            note={vomitNote}
            onChangeCount={setVomitCount}
            onChangeNote={setVomitNote}
          />
        </Card>
        <Card title="기록 사진 (선택)">
          <PhotoAttacher
            photos={logPhotos}
            disabled={isBusy}
            logExternalId={logExternalId}
            onChangePhotos={setLogPhotosState}
            onPhotoRemoved={handlePhotoRemoved}
            onPickerVisibleChange={handlePhotoPickerVisibleChange}
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

      <Animated.View
        style={[styles.footer, { transform: [{ translateY: footerAnim }] }]}
        onLayout={(e) => { footerHeightRef.current = e.nativeEvent.layout.height; }}
      >
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
      </Animated.View>
      {logHint}
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
    paddingVertical: 5,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  arrowBtn: {
    width: 40,
    height: 40,
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
    paddingBottom: 140,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  deleteBtn: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.lg,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  deleteBtnDisabled: {
    opacity: 0.5,
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  weightInput: {
    width: 80,
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 2,
  },
  weightUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
