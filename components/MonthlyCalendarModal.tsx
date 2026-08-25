import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Picker } from '@react-native-picker/picker';
import * as MediaLibrary from 'expo-media-library';
import ViewShot from 'react-native-view-shot';
import SaveIndicator from './SaveIndicator';
import { colors, spacing } from '../constants/theme';
import { showAlert, showConfirm } from '../lib/dialog';
import { logger, toLogError } from '../lib/logger';
import { LocalPhoto } from '../lib/cache/photo';
import { SaveStatus } from '../hooks/useAutoSave';
import MonthlyCalendarDownloadCanvas from './MonthlyCalendarDownloadCanvas';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_NAMES_EN = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];
const EMPTY_WEEK: (DayCell | null)[] = [null, null, null, null, null, null, null];
const SCREEN_WIDTH = Dimensions.get('window').width;
const SHEET_H_PADDING = spacing.lg;

// 다운로드 이미지 디자인(D시안: 다이어리·라운드 정사각형) 기준 캔버스 1080x1350(4:5).
// 화면 폭에 맞춰 반응형으로 그리되(CAPTURE_WIDTH), 비율과 모든 수치는 기준 캔버스 대비 동일 배율(CAPTURE_SCALE)로 스케일한다.
// 실제 내보내기 해상도는 ViewShot/html2canvas가 기기 배율(2x/3x)을 그대로 적용해 캡처하므로 별도 width/height 강제는 하지 않는다.
const CAPTURE_WIDTH = SCREEN_WIDTH - SHEET_H_PADDING * 2;
// 하단 패딩을 상단(80)과 맞추려고 50→80으로 늘린 만큼(+30), 그리드-푸터 간격을 넓힌 만큼(+28),
// 주행 위아래 여백을 넓힌 만큼(3→6, 행당 +6 × 6행 = +36) 기준 높이도 1350→1444로 늘려서
// 주행(그리드) 콘텐츠 영역은 그대로 두고 캔버스 전체 높이만 더 길어지도록 한다.
const CAPTURE_HEIGHT = Math.round(CAPTURE_WIDTH * (1444 / 1080));
const CAPTURE_SCALE = CAPTURE_WIDTH / 1080;

function dp(px: number) {
  return px * CAPTURE_SCALE;
}

// D시안 전용 색상. #FAF8F5/#7A9478/#2E2A26는 기존 테마 토큰과 값이 동일해 그대로 참조하고,
// 나머지는 스펙 지정 값을 리터럴로 사용한다(기존 테마에 대응 토큰 없음).
const diaryColors = {
  canvasBg: colors.background,
  accent: colors.primary,
  monthText: colors.textPrimary,
  weekdayText: '#A8A29A',
  weekdayBorder: '#E0DBD2',
  weekRowBorder: '#ECE8E0',
  dateFilled: '#6B665E',
  dateEmpty: '#C4BFB5',
  photoBg: '#F1EDE6',
  photoEmptyBorder: '#DCD6CB',
  footerText: '#A8A29A',
} as const;

interface Props {
  visible: boolean;
  onClose: () => void;
  photos: LocalPhoto[];
  today: string; // YYYY-MM-DD (KST)
}

interface DayCell {
  day: number;
  photo?: LocalPhoto;
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

// 웹 원격 이미지(S3 등)는 raw <img>로 렌더링해야 crossOrigin 속성이 실제 img 태그에 적용된다.
// expo-image는 웹에서 추가 props를 바깥 래퍼 View에 넘겨 내부 <img>에는 전달하지 않는다.
function CalendarThumbnail({ uri, remote }: { uri: string; remote: boolean }) {
  if (Platform.OS === 'web' && remote) {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img src={uri} crossOrigin="anonymous" style={webThumbStyle as any} />;
  }
  return <Image source={{ uri }} style={styles.dayPhoto} contentFit="cover" />;
}

function waitForImagesToLoad(container: HTMLElement): Promise<void> {
  const imgs = Array.from(container.querySelectorAll('img'));
  const imgPromises = imgs.map(
    (img) =>
      new Promise<void>((resolve) => {
        if (img.complete) {
          resolve();
          return;
        }
        img.onload = () => resolve();
        img.onerror = () => resolve();
      }),
  );

  // 다운로드 캔버스의 사진 셀은 html2canvas의 object-fit 미지원 문제 때문에 <img> 대신
  // background-image로 렌더링된다(MonthlyCalendarDownloadCanvas.tsx 참고). 이 배경 이미지도
  // 캡처 전에 로드가 끝났는지 별도로 기다려야 한다.
  const bgEls = Array.from(container.querySelectorAll<HTMLElement>('[style*="background-image"]'));
  const bgPromises = bgEls.map((el) => {
    const match = /url\(["']?(.*?)["']?\)/.exec(el.style.backgroundImage);
    const url = match?.[1];
    if (!url) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const preload = new window.Image();
      preload.onload = () => resolve();
      preload.onerror = () => resolve();
      preload.src = url;
    });
  });

  return Promise.all([...imgPromises, ...bgPromises]).then(() => undefined);
}

function buildWeeks(
  year: number,
  month: number,
  photosByDate: Map<string, LocalPhoto>,
): (DayCell | null)[][] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = new Date(year, month - 1, 1).getDay();

  const cells: (DayCell | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad2(month)}-${pad2(d)}`;
    cells.push({ day: d, photo: photosByDate.get(dateStr) });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (DayCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export default function MonthlyCalendarModal({ visible, onClose, photos, today }: Props) {
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7));

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [saving, setSaving] = useState(false);
  // 기존 SaveIndicator 알림 디자인 재사용(components/SaveIndicator.tsx, app/(tabs)/log.tsx 패턴 참고).
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [successMessage, setSuccessMessage] = useState('저장되었습니다 ✓');
  const saveIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gridRef = useRef<ViewShot>(null);
  const webGridRef = useRef<View>(null);

  useEffect(() => {
    if (visible) {
      setYear(currentYear);
      setMonth(currentMonth);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (year === currentYear && month > currentMonth) setMonth(currentMonth);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  useEffect(() => {
    return () => {
      if (saveIdleTimerRef.current) clearTimeout(saveIdleTimerRef.current);
    };
  }, []);

  const earliestYear = useMemo(() => {
    const years = photos.map((p) => Number(p.date.slice(0, 4))).filter((y) => !Number.isNaN(y));
    return years.length > 0 ? Math.min(...years, currentYear) : currentYear;
  }, [photos, currentYear]);

  const yearOptions = useMemo(() => {
    const list: number[] = [];
    for (let y = earliestYear; y <= currentYear; y++) list.push(y);
    return list;
  }, [earliestYear, currentYear]);

  const monthOptions = useMemo(() => {
    const max = year === currentYear ? currentMonth : 12;
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [year, currentYear, currentMonth]);

  const photosByDate = useMemo(() => {
    const map = new Map<string, LocalPhoto>();
    const prefix = `${year}-${pad2(month)}`;
    for (const p of photos) {
      if (p.date.startsWith(prefix)) map.set(p.date, p);
    }
    return map;
  }, [photos, year, month]);

  const weeks = useMemo(() => buildWeeks(year, month, photosByDate), [year, month, photosByDate]);

  // 주행은 항상 6행으로 고정 표시(모자란 달은 빈 행으로 패딩)해 캔버스 내 flex 분배가 매달 동일하게 유지되도록 한다.
  const paddedWeeks = useMemo(() => {
    const padded = [...weeks];
    while (padded.length < 6) padded.push(EMPTY_WEEK);
    return padded.slice(0, 6);
  }, [weeks]);

  const daysInMonthCount = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);

  const recordedCount = useMemo(() => {
    let count = 0;
    for (const week of weeks) {
      for (const cell of week) {
        if (cell && (cell.photo?.photoUri || cell.photo?.mediumUrl)) count++;
      }
    }
    return count;
  }, [weeks]);

  function renderDayCell(cell: DayCell | null, key: number) {
    if (!cell) {
      // 해당 월에 속하지 않는 칸: 투명 빈칸(자리만 차지)
      return <View key={key} style={styles.dayCell} />;
    }
    const localUri = cell.photo?.photoUri;
    const remoteUri = cell.photo?.mediumUrl;
    const thumbUri = localUri ?? remoteUri;
    return (
      <View key={key} style={styles.dayCell}>
        <Text style={[styles.dayNumber, thumbUri ? styles.dayNumberFilled : styles.dayNumberEmpty]}>
          {pad2(cell.day)}
        </Text>
        <View style={[styles.dayPhotoBox, thumbUri ? styles.dayPhotoBoxFilled : styles.dayPhotoBoxEmpty]}>
          {thumbUri ? <CalendarThumbnail uri={thumbUri} remote={!localUri && !!remoteUri} /> : null}
        </View>
      </View>
    );
  }

  const gridChildren = (
    <View style={styles.diaryCanvas}>
      <View style={styles.diaryHeader}>
        <View style={styles.diaryHeaderBar} />
        <View>
          <Text style={styles.diaryMonthText}>{month}월</Text>
          <View style={styles.diaryYearRow}>
            <Text style={styles.diaryYearText}>{year} · {MONTH_NAMES_EN[month - 1]}</Text>
          </View>
        </View>
      </View>

      <View style={styles.diaryWeekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={styles.diaryWeekdayText}>{label}</Text>
        ))}
      </View>

      {paddedWeeks.map((week, wIdx) => (
        <View key={wIdx} style={[styles.diaryWeekRow, wIdx >= weeks.length - 1 && styles.diaryWeekRowLast]}>
          {week.map((cell, dIdx) => renderDayCell(cell, dIdx))}
        </View>
      ))}

      <View style={styles.diaryFooter}>
        <Text style={styles.diaryFooterText}>꼬리</Text>
        <Text style={styles.diaryFooterText}>{recordedCount}/{daysInMonthCount}</Text>
      </View>
    </View>
  );

  function showSaved(message: string) {
    setSuccessMessage(message);
    setSaveStatus('saved');
    if (saveIdleTimerRef.current) clearTimeout(saveIdleTimerRef.current);
    saveIdleTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
  }

  async function handleSaveToAlbum() {
    if (saving) return;
    setSaving(true);
    try {
      if (Platform.OS === 'web') {
        const node = webGridRef.current as unknown as HTMLElement | null;
        if (!node) throw new Error('캡처할 화면을 찾을 수 없어요.');
        await waitForImagesToLoad(node);
        const html2canvas = (await import('html2canvas')).default;
        // scale을 올리면 더 높은 해상도로 캡처된다(파일 용량도 함께 커짐). 필요하면 이 값만 조절하면 된다.
        const canvas = await html2canvas(node, { useCORS: true, scale: 10 });
        const uri = canvas.toDataURL('image/png');

        const link = document.createElement('a');
        link.download = `kkori_${year}_${pad2(month)}.png`;
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showSaved('월력을 다운로드했어요 🐾');
        return;
      }

      const uri = await gridRef.current?.capture?.();
      if (!uri) throw new Error('캡처된 이미지를 찾을 수 없어요.');

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showConfirm(
          '사진첩 접근 권한 필요',
          '월력을 저장하려면 설정에서 사진첩 접근 권한을 허용해 주세요.',
          () => Linking.openSettings(),
          { confirmText: '설정 열기' },
        );
        return;
      }

      await MediaLibrary.saveToLibraryAsync(uri);
      showSaved('앨범에 저장했어요 🐾');
    } catch (e) {
      logger.warn('photo.calendar.save.failed', toLogError(e));
      showAlert('오류', '저장 중 문제가 발생했어요.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>하루 한장</Text>
              <Text style={styles.title}>한달 한장</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.75}>
              <Text style={styles.closeText}>닫기</Text>
            </TouchableOpacity>
          </View>

          <SaveIndicator status={saveStatus} labels={{ saved: successMessage }} centered />

          <View style={styles.monthNav}>
            {Platform.OS === 'web' ? (
              <View style={webSelectStyles.row}>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  style={webSelectStyles.select as any}
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}년</option>
                  ))}
                </select>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  style={webSelectStyles.select as any}
                >
                  {monthOptions.map((m) => (
                    <option key={m} value={m}>{m}월</option>
                  ))}
                </select>
              </View>
            ) : (
              <View style={styles.pickerRow}>
                <Picker
                  selectedValue={year}
                  onValueChange={(v) => setYear(Number(v))}
                  style={styles.pickerFlex}
                  itemStyle={styles.pickerItem}
                >
                  {yearOptions.map((y) => (
                    <Picker.Item key={y} label={`${y}년`} value={y} />
                  ))}
                </Picker>
                <Picker
                  selectedValue={month}
                  onValueChange={(v) => setMonth(Number(v))}
                  style={styles.pickerFlex}
                  itemStyle={styles.pickerItem}
                >
                  {monthOptions.map((m) => (
                    <Picker.Item key={m} label={`${m}월`} value={m} />
                  ))}
                </Picker>
              </View>
            )}
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {gridChildren}
          </ScrollView>

          {/* 캡처 전용 숨김 뷰: 미리보기와 별도 파일(MonthlyCalendarDownloadCanvas)의 독립된 스타일로 렌더링한다. */}
          <View style={styles.hiddenOffscreen} pointerEvents="none">
            {Platform.OS === 'web' ? (
              <View ref={webGridRef}>
                <MonthlyCalendarDownloadCanvas
                  year={year}
                  month={month}
                  weeks={weeks}
                  recordedCount={recordedCount}
                  daysInMonthCount={daysInMonthCount}
                />
              </View>
            ) : (
              <ViewShot ref={gridRef} options={{ format: 'png', quality: 1 }}>
                <MonthlyCalendarDownloadCanvas
                  year={year}
                  month={month}
                  weeks={weeks}
                  recordedCount={recordedCount}
                  daysInMonthCount={daysInMonthCount}
                />
              </ViewShot>
            )}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSaveToAlbum}
            disabled={saving}
            activeOpacity={0.82}
          >
            {saving ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <Text style={styles.saveBtnText}>앨범에 저장</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  title: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  monthNav: {
    marginTop: spacing.md,
  },
  pickerRow: {
    flexDirection: 'row',
  },
  pickerFlex: {
    flex: 1,
  },
  pickerItem: {
    fontSize: 18,
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingVertical: spacing.md,
  },
  hiddenOffscreen: {
    position: 'absolute',
    top: -100000,
    left: 0,
  },

  // ─── 다운로드 이미지 디자인 (D시안: 다이어리·라운드 정사각형) ─────────────
  // 기준 캔버스 1080x1350(4:5)을 화면 폭에 맞춰 CAPTURE_SCALE로 스케일링한다.
  diaryCanvas: {
    width: CAPTURE_WIDTH,
    height: CAPTURE_HEIGHT,
    backgroundColor: diaryColors.canvasBg,
    paddingTop: dp(80),
    paddingHorizontal: dp(70),
    paddingBottom: dp(80),
    flexDirection: 'column',
  },
  diaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dp(24),
  },
  diaryHeaderBar: {
    width: dp(8),
    height: dp(82),
    borderRadius: dp(4),
    backgroundColor: diaryColors.accent,
  },
  diaryMonthText: {
    fontSize: dp(66),
    lineHeight: dp(66),
    fontWeight: '700',
    color: diaryColors.monthText,
    letterSpacing: dp(66) * -0.02,
  },
  diaryYearRow: {
    marginTop: dp(10),
  },
  diaryYearText: {
    fontSize: dp(24),
    fontWeight: '600',
    color: diaryColors.accent,
    letterSpacing: dp(24) * 0.22,
  },
  diaryWeekdayRow: {
    flexDirection: 'row',
    marginTop: dp(24),
    paddingBottom: dp(16),
    borderBottomWidth: dp(2),
    borderBottomColor: diaryColors.weekdayBorder,
  },
  diaryWeekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: dp(30),
    fontWeight: '600',
    color: diaryColors.weekdayText,
    letterSpacing: dp(30) * 0.1,
  },
  diaryWeekRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: dp(6),
    borderBottomWidth: dp(2),
    borderBottomColor: diaryColors.weekRowBorder,
  },
  diaryWeekRowLast: {
    borderBottomWidth: 0,
  },
  dayCell: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: dp(3),
  },
  dayNumber: {
    fontSize: dp(28),
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: dp(28) * 0.04,
  },
  dayNumberFilled: {
    color: diaryColors.dateFilled,
  },
  dayNumberEmpty: {
    color: diaryColors.dateEmpty,
  },
  dayPhotoBox: {
    width: dp(115),
    height: dp(115),
    borderRadius: dp(28),
    overflow: 'hidden',
  },
  dayPhotoBoxFilled: {
    backgroundColor: diaryColors.photoBg,
  },
  dayPhotoBoxEmpty: {
    borderWidth: dp(2),
    borderStyle: 'dashed',
    borderColor: diaryColors.photoEmptyBorder,
  },
  dayPhoto: {
    width: '100%',
    height: '100%',
  },
  diaryFooter: {
    flexDirection: 'row',
    marginTop: dp(40),
    justifyContent: 'space-between',
  },
  diaryFooterText: {
    fontSize: dp(23),
    color: diaryColors.footerText,
    letterSpacing: dp(23) * 0.05,
  },

  saveBtn: {
    marginTop: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textOnPrimary,
  },
});

const webSelectStyles = {
  row: {
    flexDirection: 'row' as const,
    gap: 8,
    justifyContent: 'center' as const,
  },
  select: {
    flex: 1,
    fontSize: 16,
    padding: 8,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.surfaceAlt,
    color: colors.textPrimary,
  },
};

const webThumbStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover' as const,
  display: 'block' as const,
};
