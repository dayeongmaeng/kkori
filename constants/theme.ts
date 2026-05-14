export const colors = {
  primary: '#191F28',
  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F2F4F6',
  textPrimary: '#191F28',
  textSecondary: '#4E5968',
  textTertiary: '#8B95A1',
  textQuaternary: '#B0B8C1',
  textOnPrimary: '#FFFFFF',
  success: '#00B8A0',
  warning: '#FFB930',
  danger: '#E94B5A',
  info: '#4A90E2',
  border: '#E5E8EB',
  divider: '#F2F4F6',
  condition1: '#E94B5A',
  condition2: '#FFB930',
  condition3: '#B0B8C1',
  condition4: '#7AC97A',
  condition5: '#00B8A0',
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
