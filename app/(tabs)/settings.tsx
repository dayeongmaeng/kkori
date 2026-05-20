import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import {
  Bell, Camera, ChevronRight, Database, FileText,
  Heart, Image as ImageIcon, Info, MessageCircle, Newspaper,
  PawPrint, Shield, Star, Trash2,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

const FEEDBACK_URL = 'https://open.kakao.com/o/seTWQ4ui';
const PRIVACY_URL = 'https://fine-megaraptor-e63.notion.site/366df0ef164c80909f5aef93dd5f7b72';
const TERMS_URL = 'https://fine-megaraptor-e63.notion.site/366df0ef164c80d2b9b9f5efb2591b21';
const NEWS_URL = 'https://fine-megaraptor-e63.notion.site/366df0ef164c80338ad5c5c5e794ed3e?pvs=73';
const DONATION_URL = 'supertoss://send?bank=%EC%B9%B4%EC%B9%B4%EC%98%A4%EB%B1%85%ED%81%AC&accountNo=3333227317180';
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const CACHE_KEYS = [
  'pet-care:api:pets',
  'pet-care:api:current-pet-id',
  'pet-care:api:current-caregiver-id',
] as const;
const CACHE_KEY_PREFIXES = [
  'pet-care:api:photos:',
  'pet-care:api:logs:',
  'pet-care:api:pet-photo:',
  'pet-care:photo-data:',
  'pet-care:log-photos:',
] as const;

function openURL(url: string) {
  Linking.openURL(url).catch(() => Alert.alert('오류', '링크를 열 수 없어요.'));
}

function openSettings() {
  if (Platform.OS === 'web') { Alert.alert('알림', '기기 설정에서 권한을 변경해 주세요.'); return; }
  Linking.openSettings();
}

function GroupTitle({ label }: { label: string }) {
  return <Text style={s.groupTitle}>{label}</Text>;
}

function ComingSoonBadge() {
  return <View style={s.badge}><Text style={s.badgeText}>출시 예정</Text></View>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={s.card}>{children}</View>;
}

function isCacheKey(key: string) {
  return CACHE_KEYS.some((cacheKey) => cacheKey === key)
    || CACHE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

interface RowProps {
  icon: React.ReactNode;
  label: string;
  desc?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  last?: boolean;
}
function Row({ icon, label, desc, right, onPress, disabled, last }: RowProps) {
  return (
    <>
      <TouchableOpacity
        style={[s.row, disabled && s.rowDisabled]}
        onPress={onPress}
        disabled={disabled || !onPress}
        activeOpacity={0.7}
      >
        <View style={s.rowIcon}>{icon}</View>
        <View style={s.rowBody}>
          <Text style={s.rowLabel}>{label}</Text>
          {desc ? <Text style={s.rowDesc}>{desc}</Text> : null}
        </View>
        {right !== undefined ? right : (onPress ? <ChevronRight size={16} color={colors.textQuaternary} /> : null)}
      </TouchableOpacity>
      {!last && <View style={s.divider} />}
    </>
  );
}

export default function SettingsScreen() {
  const [wagCount, setWagCount] = useState(0);

  async function handleClearCache() {
    Alert.alert('캐시 비우기', '저장된 임시 데이터를 모두 삭제할까요?\n다음 실행 시 서버에서 다시 불러옵니다.', [
      { text: '취소', style: 'cancel' },
      { text: '비우기', style: 'destructive', onPress: async () => {
        try {
          const keys = await AsyncStorage.getAllKeys();
          const cacheKeys = keys.filter(isCacheKey);
          if (cacheKeys.length > 0) {
            await AsyncStorage.multiRemove(cacheKeys);
          }
          Alert.alert('완료', '캐시를 비웠어요');
        } catch {
          Alert.alert('오류', '캐시를 비우지 못했어요');
        }
      }},
    ]);
  }

  function handleReview() {
    if (Platform.OS === 'ios') {
      openURL('itms-apps://itunes.apple.com/app/id'); // TODO: 앱 출시 후 실제 ID로 교체
    } else {
      Alert.alert('리뷰 남기기', 'iOS 앱 출시 후 이용할 수 있어요 🐾');
    }
  }

  function handleDonation() {
    Alert.alert(
      '꼬리 응원하기',
      '17년 함께한 반려견을 떠나보낸 경험으로 꼬리를 만들고 있어요.\n\n후원은 선택사항이며 앱 기능에 영향을 주지 않아요.',
      [
        { text: '닫기', style: 'cancel' },
        { text: '토스 열기', onPress: () => openURL(DONATION_URL) },
      ],
    );
  }

  async function handleWag() {
    const next = wagCount + 1;
    setWagCount(next);
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const msgs = ['🐾 꼬리가 흔들려요!', '🐾🐾 더 빠르게!', '🐾🐾🐾 멈출 수가 없어요!!'];
    Alert.alert('', msgs[Math.min(next - 1, msgs.length - 1)]);
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
    {/*
           <GroupTitle label="알림" />
            <Card>
              <Row icon={<Bell size={20} color={colors.textSecondary} />} label="알림 권한" desc="시스템 설정 열기" onPress={openSettings} />
              {<Row icon={<Bell size={20} color={colors.textQuaternary} />} label="약 복용 알림" right={<ComingSoonBadge />} disabled />}
              {<Row icon={<Bell size={20} color={colors.textQuaternary} />} label="데일리 포토 리마인더" right={<ComingSoonBadge />} disabled last /> }
            </Card>
      */}

      <GroupTitle label="권한" />
      <Card>
        <Row icon={<Bell size={20} color={colors.textSecondary} />} label="알림 권한" desc="시스템 설정 열기" onPress={openSettings} />
        <Row icon={<Camera size={20} color={colors.textSecondary} />} label="카메라 권한" desc="시스템 설정 열기" onPress={openSettings} />
        <Row icon={<ImageIcon size={20} color={colors.textSecondary} />} label="사진 접근 권한" desc="시스템 설정 열기" onPress={openSettings} last />
      </Card>

      <GroupTitle label="데이터" />
      <Card>
        <Row icon={<Database size={20} color={colors.textQuaternary} />} label="데이터 백업 / 내보내기" right={<ComingSoonBadge />} disabled />
        <Row icon={<Database size={20} color={colors.textQuaternary} />} label="데이터 가져오기" right={<ComingSoonBadge />} disabled />
        <Row icon={<Trash2 size={20} color={colors.danger} />} label="캐시 비우기" onPress={handleClearCache} last />
      </Card>

      <GroupTitle label="정보" />
      <Card>
        <Row icon={<Shield size={20} color={colors.textSecondary} />} label="개인정보 처리방침" onPress={() => openURL(PRIVACY_URL)} />
        <Row icon={<FileText size={20} color={colors.textSecondary} />} label="이용약관" onPress={() => openURL(TERMS_URL)} />
        <Row icon={<Info size={20} color={colors.textSecondary} />} label="버전 정보" right={<Text style={s.versionText}>v{APP_VERSION}</Text>} last />
      </Card>

      <GroupTitle label="지원" />
      <Card>
        <Row icon={<MessageCircle size={20} color={colors.textSecondary} />} label="문의하기" desc="카카오 오픈채팅" onPress={() => openURL(FEEDBACK_URL)} />
        <Row icon={<Newspaper size={20} color={colors.textSecondary} />} label="업데이트 소식" onPress={() => openURL(NEWS_URL)} />
        <Row icon={<Star size={20} color={colors.textSecondary} />} label="리뷰 남기기" desc="앱스토어에서 별점 남기기" onPress={handleReview} />
        <Row icon={<Heart size={20} color={colors.accent} />} label="꼬리 응원하기" desc="개발자에게 간식 사주기" onPress={handleDonation} />
        <Row icon={<PawPrint size={20} color={colors.accent} />} label="꼬리 흔들게 하기 🐾" onPress={handleWag} last />
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 60 },

  groupTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textTertiary,
    paddingHorizontal: spacing.lg,
    marginTop: 24,
    marginBottom: 8,
  },

  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  rowDisabled: { opacity: 0.45 },

  rowIcon: { width: 24, alignItems: 'center' },
  rowBody: { flex: 1, justifyContent: 'center' },
  rowLabel: { fontSize: 15, color: colors.textPrimary },
  rowDesc: { fontSize: 12, color: colors.textTertiary, marginTop: 1 },

  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: 52, // 16 padding + 24 icon + 12 gap
  },

  badge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '600', color: colors.accent },

  versionText: { fontSize: 13, color: colors.textTertiary },
});
