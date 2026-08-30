import { Dimensions, Platform, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { colors, spacing } from '../constants/theme';
import { LocalPhoto } from '../lib/cache/photo';

// 이 파일은 다운로드/저장 이미지(D시안: 다이어리·라운드 정사각형) 전용 렌더링이다.
// 화면 미리보기(MonthlyCalendarModal.tsx)와는 스타일/치수/색상을 전혀 공유하지 않고 이 파일 안에서 독립적으로 정의한다.
//
// 웹에서는 반드시 raw <div>/<span> + 인라인 style로 렌더링한다.
// react-native-web의 View/Text는 동적으로 생성한 CSS 클래스(스타일시트)로 스타일을 적용하는데,
// html2canvas가 DOM을 복제(cloneNode)할 때 이 클래스 기반 스타일시트 규칙을 안정적으로 따라가지 못해
// padding/gap/margin 등이 캡처 결과에서 통째로 누락되는 문제가 있었다(실제 다운로드 이미지로 확인됨).
// 인라인 style 속성은 cloneNode로 항상 그대로 복제되므로 웹에서는 이 방식을 쓴다.
// 네이티브(ViewShot)는 실제 네이티브 레이어를 캡처해 이 문제가 없어 View/Text를 그대로 쓴다.
const Box: any = Platform.OS === 'web' ? 'div' : View;
const Label: any = Platform.OS === 'web' ? 'span' : Text;

function lh(px: number): number | string {
  // React DOM은 lineHeight를 단위 없는 배수로 해석하므로(RN은 절대값) 웹에서는 px 문자열로 명시한다.
  return Platform.OS === 'web' ? `${px}px` : px;
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_NAMES_EN = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

export interface DownloadDayCell {
  day: number;
  photo?: LocalPhoto;
}

const EMPTY_WEEK: (DownloadDayCell | null)[] = [null, null, null, null, null, null, null];

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

// 기준 캔버스 1080x1350(4:5). 화면 폭에 맞춰 반응형으로 스케일링한다.
const SCREEN_WIDTH = Dimensions.get('window').width;
const H_MARGIN = spacing.lg;
const CANVAS_WIDTH = SCREEN_WIDTH - H_MARGIN * 2;
// 상단 타이틀 잘림 방지를 위해 paddingTop을 80→120으로 늘린 만큼(+40) 기준 높이도 1444→1500으로 늘렸다.
// 그리드 콘텐츠 영역은 그대로 두고 캔버스 상단 여백만 더 넓어지도록 한다.
const CANVAS_HEIGHT = Math.round(CANVAS_WIDTH * (1500 / 1080));
const CANVAS_SCALE = CANVAS_WIDTH / 1080;

function dp(px: number) {
  return px * CANVAS_SCALE;
}

const downloadColors = {
  canvasBg: colors.background, // #FAF8F5
  accent: colors.primary, // #7A9478
  monthText: colors.textPrimary, // #2E2A26
  weekdayText: '#A8A29A',
  weekdayBorder: '#E0DBD2',
  weekRowBorder: '#ECE8E0',
  dateFilled: '#6B665E',
  dateEmpty: '#C4BFB5',
  photoBg: '#F1EDE6',
  photoEmptyBorder: '#DCD6CB',
  footerText: '#A8A29A',
} as const;

// ─── 스타일: RN(View/Text)과 웹 raw div/span 양쪽에서 그대로 쓸 수 있는 "평범한" 스타일 객체.
// paddingHorizontal/paddingVertical/gap 같은 RN 전용 축약 속성은 실제 CSS 속성이 아니라서
// raw div에서는 무시되므로 paddingLeft+paddingRight 등 개별 속성만 사용하고, gap 대신 margin을 쓴다.
// display:'flex'는 RN에서는 기본값이라 무해하고, 웹 div에서는 flex 컨테이너로 만들기 위해 필요하다.
// boxSizing:'border-box'도 마찬가지로 웹 전용 이유가 있다: react-native-web은 View에 이 값을 자동으로
// 적용하지만(브라우저 기본값인 content-box와 달리 padding이 지정한 width 안에 포함됨) raw <div>는
// 브라우저 기본값(content-box)을 쓰므로 명시하지 않으면 padding만큼 실제 폭이 더 넓어져 버린다.
// 이 차이 때문에 캔버스 좌우 padding(70)만큼 다운로드 이미지의 사진 사이 여백이 미리보기보다 넓어 보였다.
const styles = {
  canvas: {
    display: 'flex',
    boxSizing: 'border-box',
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: downloadColors.canvasBg,
    paddingTop: dp(120),
    paddingLeft: dp(70),
    paddingRight: dp(70),
    paddingBottom: dp(80),
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBar: {
    width: dp(8),
    height: dp(82),
    borderRadius: dp(4),
    backgroundColor: downloadColors.accent,
    marginRight: dp(24),
  },
  monthText: {
    fontSize: dp(66),
    lineHeight: lh(dp(86)),
    fontWeight: '700',
    color: downloadColors.monthText,
    letterSpacing: dp(66) * -0.02,
  },
  yearRow: {
    marginTop: dp(10),
  },
  yearText: {
    fontSize: dp(24),
    fontWeight: '600',
    color: downloadColors.accent,
    letterSpacing: dp(24) * 0.22,
  },
  weekdayRow: {
    display: 'flex',
    boxSizing: 'border-box',
    flexDirection: 'row',
    marginTop: dp(24),
    paddingBottom: dp(16),
    borderBottomWidth: dp(2),
    borderBottomColor: downloadColors.weekdayBorder,
    borderBottomStyle: 'solid',
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: dp(30),
    fontWeight: '600',
    color: downloadColors.weekdayText,
    letterSpacing: dp(30) * 0.1,
  },
  weekRow: {
    display: 'flex',
    boxSizing: 'border-box',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: dp(6),
    paddingBottom: dp(6),
    borderBottomWidth: dp(2),
    borderBottomColor: downloadColors.weekRowBorder,
    borderBottomStyle: 'solid',
  },
  weekRowLast: {
    borderBottomWidth: 0,
  },
  dayCell: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: dp(28),
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: dp(28) * 0.04,
    marginBottom: dp(3),
  },
  dayNumberFilled: {
    color: downloadColors.dateFilled,
  },
  dayNumberEmpty: {
    color: downloadColors.dateEmpty,
  },
  dayPhotoBox: {
    display: 'flex',
    boxSizing: 'border-box',
    width: dp(115),
    height: dp(115),
    borderRadius: dp(28),
    overflow: 'hidden',
  },
  dayPhotoBoxFilled: {
    backgroundColor: downloadColors.photoBg,
  },
  dayPhotoBoxEmpty: {
    borderWidth: dp(2),
    borderStyle: 'dashed',
    borderColor: downloadColors.photoEmptyBorder,
  },
  dayPhoto: {
    width: '100%',
    height: '100%',
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: dp(40),
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: dp(23),
    color: downloadColors.footerText,
    letterSpacing: dp(23) * 0.05,
  },
} as const;

function mergeStyle(...parts: (object | false | null | undefined)[]) {
  return Object.assign({}, ...parts.filter(Boolean));
}

// html2canvas는 <img>의 object-fit(및 expo-image가 웹에서 쓰는 object-fit)을 캡처 시 무시하고
// 이미지를 박스 크기에 맞게 늘려서 그린다(비율 무시). 그 결과 다운로드 이미지에서만 사진이 찌그러져
// 보였다(실제 다운로드 파일로 확인됨). CSS background-image + background-size:cover는 html2canvas가
// 안정적으로 지원하므로 웹에서는 <img> 대신 이 방식으로 렌더링한다. 네이티브(ViewShot)는 이 문제가 없어
// 기존 Image(contentFit="cover")를 그대로 쓴다.
function DownloadThumbnail({ uri }: { uri: string }) {
  if (Platform.OS === 'web') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url(${uri})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } as any}
      />
    );
  }
  return <Image source={{ uri }} style={styles.dayPhoto} contentFit="cover" />;
}

function renderDayCell(cell: DownloadDayCell | null, key: number) {
  if (!cell) {
    return <Box key={key} style={styles.dayCell} />;
  }
  const localUri = cell.photo?.photoUri;
  const remoteUri = cell.photo?.mediumUrl;
  const thumbUri = localUri ?? remoteUri;
  return (
    <Box key={key} style={styles.dayCell}>
      <Label style={mergeStyle(styles.dayNumber, thumbUri ? styles.dayNumberFilled : styles.dayNumberEmpty)}>
        {pad2(cell.day)}
      </Label>
      <Box style={mergeStyle(styles.dayPhotoBox, thumbUri ? styles.dayPhotoBoxFilled : styles.dayPhotoBoxEmpty)}>
        {thumbUri ? <DownloadThumbnail uri={thumbUri} /> : null}
      </Box>
    </Box>
  );
}

interface Props {
  year: number;
  month: number;
  weeks: (DownloadDayCell | null)[][];
  recordedCount: number;
  daysInMonthCount: number;
}

export default function MonthlyCalendarDownloadCanvas({
  year,
  month,
  weeks,
  recordedCount,
  daysInMonthCount,
}: Props) {
  const rows = [...weeks];
  while (rows.length < 6) rows.push(EMPTY_WEEK);
  const paddedRows = rows.slice(0, 6);

  return (
    <Box style={styles.canvas}>
      <Box style={styles.header}>
        <Box style={styles.headerBar} />
        <Box>
          <Label style={styles.monthText}>{month}월</Label>
          <Box style={styles.yearRow}>
            <Label style={styles.yearText}>{year} · {MONTH_NAMES_EN[month - 1]}</Label>
          </Box>
        </Box>
      </Box>

      <Box style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Label key={label} style={styles.weekdayText}>{label}</Label>
        ))}
      </Box>

      {paddedRows.map((week, wIdx) => (
        <Box key={wIdx} style={mergeStyle(styles.weekRow, wIdx >= weeks.length - 1 && styles.weekRowLast)}>
          {week.map((cell, dIdx) => renderDayCell(cell, dIdx))}
        </Box>
      ))}

      <Box style={styles.footer}>
        <Label style={styles.footerText}>꼬리</Label>
        <Label style={styles.footerText}>{recordedCount}/{daysInMonthCount}</Label>
      </Box>
    </Box>
  );
}
