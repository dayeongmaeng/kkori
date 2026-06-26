import { Platform, ViewStyle } from 'react-native';

export const colors = {
  // ─── Brand ───────────────────────────────────────────────
  primary: '#7A9478',          // 세이지 그린 (메인)
  primaryMid: '#5E7A5C',       // 딥 세이지 (pressed / active)
  primarySoft: '#E8EFEA',      // 소프트 세이지 (칩·뱃지 배경)

  secondary: '#B89C86',        // 웜 모카 (보조 브랜드)
  secondarySoft: '#F2EBE2',

  // ─── Backgrounds ─────────────────────────────────────────
  background: '#FAF8F5',       // 앱 전체 배경
  card: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F4EFE9',       // 섹션 구분용 서피스

  // ─── Text ────────────────────────────────────────────────
  text: '#2E2A26',             // = textPrimary 별칭
  textPrimary: '#2E2A26',
  textSecondary: '#7C746B',
  textTertiary: '#A89F95',     // 플레이스홀더·보조 레이블
  textQuaternary: '#C3BBB0',   // 비활성·캡션
  textOnPrimary: '#FFFFFF',    // 세이지 버튼 위 텍스트

  // ─── Point — 단 하나의 포인트 ★ ─────────────────────────
  point: '#7A9478',            // 주요 버튼·선택 상태·아바타 링
  pointPressed: '#5E7A5C',     // 탭/롱프레스
  pointSoft: '#E8EFEA',        // 강조 칩·하이라이트 배경

  // ─── UI Elements ─────────────────────────────────────────
  border: '#ECE7E2',
  divider: '#ECE7E2',

  // ─── Semantic ────────────────────────────────────────────
  danger: '#D9776A',
  dangerBg: '#FBEAE6',
  success: '#7A9478',          // 포인트 세이지와 통일
  successBg: '#E8EFEA',
  warning: '#D2A05E',
  warningBg: '#F6F0E8',
  info: '#8F9CA8',
  infoBg: '#EFF1F3',

  // ─── Condition States (pet health) ───────────────────────
  condition1: '#D9776A',       // 매우 나쁨
  condition2: '#E8A85C',       // 나쁨
  condition3: '#C3BBB0',       // 보통
  condition4: '#9BBE88',       // 좋음
  condition5: '#7A9478',       // 매우 좋음 (= point)

  // ─── Legacy Aliases (하위 호환) ──────────────────────────
  accent: '#D9776A',
  accentSoft: '#FBEAE6',
} as const;

// ─── Spacing ───────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// ─── Border Radius ─────────────────────────────────────────
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

// ─── Shadow Tokens ─────────────────────────────────────────
// iOS: 정밀한 그림자 레이어
// Android: elevation 단일 값
export const shadow = {
  xs: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

// ─── platformShadow ────────────────────────────────────────
type ShadowToken = (typeof shadow)[keyof typeof shadow];

export function platformShadow(token: ShadowToken): ViewStyle {
  return (
    Platform.select<ViewStyle>({
      ios: {
        shadowColor: token.shadowColor,
        shadowOffset: token.shadowOffset,
        shadowOpacity: token.shadowOpacity,
        shadowRadius: token.shadowRadius,
      },
      android: { elevation: token.elevation },
      default: {},
    }) ?? {}
  );
}

// ─── Typography Scale (iOS SF Pro 기준) ────────────────────
export const typography = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700' as const },
  title1:     { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  title2:     { fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
  title3:     { fontSize: 20, lineHeight: 25, fontWeight: '600' as const },
  headline:   { fontSize: 17, lineHeight: 22, fontWeight: '600' as const },
  body:       { fontSize: 17, lineHeight: 22, fontWeight: '400' as const },
  callout:    { fontSize: 16, lineHeight: 21, fontWeight: '400' as const },
  subhead:    { fontSize: 15, lineHeight: 20, fontWeight: '400' as const },
  footnote:   { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  caption1:   { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  caption2:   { fontSize: 11, lineHeight: 13, fontWeight: '400' as const },
} as const;