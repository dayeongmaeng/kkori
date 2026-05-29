import { Platform, ViewStyle } from 'react-native';

// Color System v1 + v2
export const colors = {
  // Brand
  primary: '#D88C73',
  secondary: '#8F9A8D',
  primarySoft: '#FFE4D1',

  // Backgrounds
  background: '#FAF8F5',
  card: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F0EDE9',

  // Text
  text: '#2F2F2F',
  textPrimary: '#2F2F2F',
  textSecondary: '#6B6B6B',
  textTertiary: '#8B95A1',
  textQuaternary: '#B0B8C1',
  textOnPrimary: '#FFFFFF',

  // Semantic colors
  danger: '#D66A6A',
  dangerBg: '#F7ECEA',
  success: '#8FA38D',
  successBg: '#EEF2ED',
  warning: '#C8A06B',
  warningBg: '#F6F0E8',
  info: '#8FA0B2',
  infoBg: '#EEF2F5',

  // UI elements
  border: '#ECE7E2',
  divider: '#ECE7E2',
  accent: '#D66A6A',      // danger 별칭 — 하위 호환
  accentSoft: '#F7ECEA',  // dangerBg 별칭 — 하위 호환

  // Condition states (pet health — UI semantic과 별도)
  condition1: '#D66A6A',
  condition2: '#FFB930',
  condition3: '#B0B8C1',
  condition4: '#7AC97A',
  condition5: '#8FA38D',
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
