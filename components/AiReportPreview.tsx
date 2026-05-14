import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CardProps {
  icon: string;
  title: string;
  description: string;
}

function ReportCard({ icon, title, description }: CardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => Alert.alert('곧 출시될 기능이에요 🐾', '조금만 기다려주세요')}
      activeOpacity={0.75}
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>출시 예정</Text>
      </View>
      <View style={styles.row}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>{icon}</Text>
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
          icon="🏥"
          title="병원 방문용 리포트"
          description="수의사 진료를 위한 건강 요약"
        />
        <ReportCard
          icon="💚"
          title={weekTitle}
          description="AI가 보호자를 위해 정리한 일기"
        />
      </View>
    </View>
  );
}

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  android: { elevation: 2 },
  default: {},
});

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D2C1E',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  cards: {
    marginHorizontal: 16,
    gap: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    opacity: 0.85,
    ...cardShadow,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFE4D1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E8985C',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingRight: 72,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 26,
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3D2C1E',
  },
  cardDesc: {
    fontSize: 13,
    color: '#8C7B6B',
  },
});
