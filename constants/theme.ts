import { Platform, ViewStyle } from 'react-native';

export const colors = {
  // Brand
  primary: '#8C9A86',
  secondary: '#B89C86',
  primarySoft: '#EAEFE6',  // 소프트 세이지 (기존 peach 정리)

  // Backgrounds
  background: '#FAF8F5',
  card: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F4EFE9',

  // Text
  text: '#2E2A26',
  textPrimary: '#2E2A26',
  textSecondary: '#7C746B',
  textTertiary: '#A89F95',  // 차가운 회색 → 따뜻한 회색
  textQuaternary: '#C3BBB0',  // 차가운 회색 → 따뜻한 회색
  textOnPrimary: '#FFFFFF',

  // Semantic colors
  danger: '#D9776A',
  dangerBg: '#FBEAE6',
  success: '#8C9A86',  // 브랜드 세이지와 통일
  successBg: '#EEF1EC',
  warning: '#D2A05E',
  warningBg: '#F6F0E8',
  info: '#8F9CA8',  // 유일한 쿨 힌트 — 최소화
  infoBg: '#EFF1F3',

  // UI elements
  border: '#ECE7E2',
  divider: '#ECE7E2',
  point: '#E0917A',  // ⭐ 단 하나의 포인트 — 주요 버튼·선택·아바타
  pointSoft: '#FBE7DC',  // 강조 칩·하이라이트
  accent: '#D9776A',  // danger 별칭 — 하위 호환
  accentSoft: '#FBEAE6',  // dangerBg 별칭 — 하위 호환

  // Condition states (pet health)
  condition1: '#D9776A',
  condition2: '#E8A85C',
  condition3: '#C3BBB0',
  condition4: '#9DBE86',
  condition5: '#8C9A86',
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
} as const;

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, full: 999,
} as const;

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

type ShadowToken = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

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
