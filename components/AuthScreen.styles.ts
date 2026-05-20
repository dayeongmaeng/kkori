import { Dimensions, Platform, StyleSheet } from 'react-native';

import { colors, radius, shadow, spacing } from '../constants/theme';

const { height } = Dimensions.get('window');
const isShortScreen = height < 700;

export const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  titleArea: {
    flex: isShortScreen ? 2.7 : 2.85,
    justifyContent: 'flex-end',
    paddingBottom: spacing.md,
  },
  logo: {
    width: isShortScreen ? 74 : 86,
    height: isShortScreen ? 74 : 86,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 1 },
      default: {},
    }),
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  headline: {
    fontSize: isShortScreen ? 30 : 34,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: isShortScreen ? 38 : 42,
    textAlign: 'left',
  },
  subhead: {
    marginTop: spacing.md,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'left',
  },
  logoArea: {
    flex: isShortScreen ? 2.1 : 2.35,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: isShortScreen ? spacing.lg : spacing.xl,
  },
  logoCaption: {
    fontSize: 12,
    lineHeight: 17,
    color: '#9AA0A6',
    textAlign: 'center',
  },
  actions: {
    flex: isShortScreen ? 2.7 : 2.8,
    justifyContent: 'center',
    gap: spacing.md,
    paddingBottom: isShortScreen ? spacing.xs : spacing.md,
  },
  kakaoButton: {
    minHeight: isShortScreen ? 56 : 58,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#FEE500',
  },
  googleButton: {
    minHeight: isShortScreen ? 56 : 58,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: shadow.sm,
      android: { elevation: shadow.sm.elevation },
      default: {},
    }),
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonIcon: {
    position: 'absolute',
    left: spacing.lg,
  },
  googleMark: {
    position: 'absolute',
    left: spacing.lg,
    width: 24,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  kakaoText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#191919',
  },
  googleText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  errorText: {
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 13,
    lineHeight: 19,
    color: colors.danger,
    textAlign: 'center',
  },
  termsText: {
    paddingHorizontal: spacing.md,
    fontSize: 11,
    lineHeight: 18,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
