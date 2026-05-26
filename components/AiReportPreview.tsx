import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../constants/theme';
import IconImage from './IconImage';

const imgDoctorReport = require('../assets/home/doctor-report.png');
const imgWeekendReport = require('../assets/home/weekend-report.png');

const cardShadow: ViewStyle = Platform.select<ViewStyle>({
  ios: {
    shadowColor: shadow.sm.shadowColor,
    shadowOffset: shadow.sm.shadowOffset,
    shadowOpacity: shadow.sm.shadowOpacity,
    shadowRadius: shadow.sm.shadowRadius,
  },
  android: { elevation: shadow.sm.elevation },
  default: {},
}) ?? {};

interface CardProps {
  imgSource: number;
  iconFallback: string;
  title: string;
  description: string;
}

function ReportCard({ imgSource, iconFallback, title, description }: CardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        if (Platform.OS === 'web') {
          window.alert('곧 출시될 기능이에요 🐾\n조금만 기다려주세요');
        } else {
          Alert.alert('곧 출시될 기능이에요 🐾', '조금만 기다려주세요');
        }
      }}
      activeOpacity={0.75}
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>출시 예정</Text>
      </View>
      <View style={styles.row}>
        <View style={styles.iconCircle}>
          <IconImage source={imgSource} fallback={iconFallback} size={26} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDesc}>{description}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface Props {
  petName?: string;
}

export default function AiReportPreview({ petName }: Props) {
  const weekTitle = petName ? `이번 주 ${petName}는` : '이번 주 우리 아이는';

  return (
    <View>
      <Text style={styles.sectionTitle}>AI 리포트</Text>
      <View style={styles.cards}>
        <ReportCard
          imgSource={imgDoctorReport}
          iconFallback="🏥"
          title="병원 방문용 리포트"
          description="수의사 진료를 위한 건강 요약"
        />
        <ReportCard
          imgSource={imgWeekendReport}
          iconFallback="💚"
          title={weekTitle}
          description="AI가 보호자를 위해 정리한 일기"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  cards: {
    marginHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    opacity: 0.85,
    ...cardShadow,
  },
  badge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.warningBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md + 2,
    paddingRight: 72,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
