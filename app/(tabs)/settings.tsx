import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import {
  Bell, Camera, ChevronRight, Clock, Database, FileText,
  Heart, Image as ImageIcon, Info, LogOut, MessageCircle, Newspaper,
  PawPrint, Shield, Star, Trash2, UserX,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import { showAlert, showConfirm } from '../../lib/dialog';
import { useAuth } from '../../contexts/AuthContext';
import { logger, toLogError } from '../../lib/logger';
import {
  getNotificationPermissionStatus,
  loadNotificationTime,
  requestNotificationPermission,
  saveNotificationTime,
  scheduleDailyNotification,
} from '../../lib/notifications';

let DateTimePicker: any = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch {
  DateTimePicker = null;
}

const FEEDBACK_URL = 'https://open.kakao.com/o/sqYtAKvi';
// TODO: 앱 출시 후 실제 스토어 URL로 교체
const IOS_REVIEW_URL = 'itms-apps://itunes.apple.com/app/id'; // TODO: App Store ID 교체
const ANDROID_REVIEW_URL = 'https://play.google.com/store/apps/details?id=com.kkori.app'; // TODO: 실제 패키지명으로 교체
const FEEDBACK_EMAIL = 'dayeongmaeng@gmail.com';
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

type WebNotifPerm = 'granted' | 'denied' | 'default' | 'unsupported';
type WebCameraPerm = 'granted' | 'denied' | 'prompt' | 'unsupported';

function getWebNotifDesc(perm: WebNotifPerm): string {
  switch (perm) {
    case 'granted': return '허용됨';
    case 'denied': return '차단됨 · 탭해서 안내 보기';
    case 'default': return '탭해서 알림 권한 요청하기';
    case 'unsupported': return '이 브라우저에서 지원하지 않아요';
  }
}

function getWebCameraDesc(perm: WebCameraPerm): string {
  switch (perm) {
    case 'granted': return '허용됨';
    case 'denied': return '차단됨 · 탭해서 안내 보기';
    case 'prompt': return '촬영 시 브라우저가 권한을 요청해요';
    case 'unsupported': return '촬영 시 브라우저가 권한을 요청해요';
  }
}

function openURL(url: string) {
  Linking.openURL(url).catch(() => Alert.alert('오류', '링크를 열 수 없어요.'));
}

function openSettings() {
  if (Platform.OS === 'web') { Alert.alert('알림', '기기 설정에서 권한을 변경해 주세요.'); return; }
  Linking.openSettings();
}

function detectBrowserName(ua: string): string {
  if (ua.includes('CriOS')) return 'Chrome (iOS)';
  if (ua.includes('FxiOS')) return 'Firefox (iOS)';
  if (ua.includes('EdgiOS')) return 'Edge (iOS)';
  if (ua.includes('SamsungBrowser')) return 'Samsung Internet';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Safari') && ua.includes('Version/')) return 'Safari';
  return '알 수 없음';
}

function detectOSName(ua: string): string {
  const iosMatch = ua.match(/iPhone OS ([\d_]+)/);
  if (iosMatch) return `iOS ${iosMatch[1].replace(/_/g, '.')}`;
  if (ua.includes('iPad')) return 'iPadOS';
  const androidMatch = ua.match(/Android ([\d.]+)/);
  if (androidMatch) return `Android ${androidMatch[1]}`;
  if (ua.includes('Windows NT')) return 'Windows';
  if (ua.includes('Mac OS X')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  return '알 수 없음';
}

function detectDeviceName(ua: string): string {
  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('iPad')) return 'iPad';
  if (ua.includes('Android') && ua.includes('Mobile')) return 'Android 스마트폰';
  if (ua.includes('Android')) return 'Android 태블릿';
  return '데스크톱';
}

function buildFeedbackMailtoHref(): string {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const body = [
    '사용 환경:',
    '- iOS / Android / Web',
    '',
    '유형:',
    '- 버그 제보',
    '- 기능 제안',
    '- 불편 사항',
    '- 기타 의견',
    '',
    '내용:',
    '(자유 입력)',
    '',
    '----------------------',
    `앱 버전: ${APP_VERSION}`,
    '환경: Web',
    `브라우저: ${detectBrowserName(ua)}`,
    `OS: ${detectOSName(ua)}`,
    `기기: ${detectDeviceName(ua)}`,
    '----------------------',
  ].join('\n');
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('[꼬리 의견]')}&body=${encodeURIComponent(body)}`;
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
  destructive?: boolean;
}
function Row({ icon, label, desc, right, onPress, disabled, last, destructive }: RowProps) {
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
          <Text style={[s.rowLabel, destructive && s.rowLabelDestructive]}>{label}</Text>
          {desc ? <Text style={s.rowDesc}>{desc}</Text> : null}
        </View>
        {right !== undefined ? right : (onPress ? <ChevronRight size={16} color={colors.textQuaternary} /> : null)}
      </TouchableOpacity>
      {!last && <View style={s.divider} />}
    </>
  );
}

function formatNotifTime(hour: number, minute: number): string {
  const period = hour < 12 ? '오전' : '오후';
  const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const m = minute.toString().padStart(2, '0');
  return `${period} ${h}:${m}`;
}

export default function SettingsScreen() {
  const [wagCount, setWagCount] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showWebReviewModal, setShowWebReviewModal] = useState(false);
  const [webNotifPerm, setWebNotifPerm] = useState<WebNotifPerm>('unsupported');
  const [webCameraPerm, setWebCameraPerm] = useState<WebCameraPerm>('unsupported');

  const [notifTime, setNotifTime] = useState({ hour: 22, minute: 0 });
  const [notifPermission, setNotifPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const pickerDateRef = useRef<Date>(new Date());

  const { logout, deleteAccount } = useAuth();

  useEffect(() => {
    if (Platform.OS !== 'web') {
      void (async () => {
        const [time, perm] = await Promise.all([
          loadNotificationTime(),
          getNotificationPermissionStatus(),
        ]);
        setNotifTime(time);
        setNotifPermission(perm);
        const d = new Date();
        d.setHours(time.hour, time.minute, 0, 0);
        pickerDateRef.current = d;
      })();
      return;
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setWebNotifPerm(Notification.permission as WebNotifPerm);
    }
    if (typeof navigator !== 'undefined' && navigator.permissions) {
      navigator.permissions
        .query({ name: 'camera' as PermissionName })
        .then((result) => setWebCameraPerm(result.state as WebCameraPerm))
        .catch(() => setWebCameraPerm('unsupported'));
    }
  }, []);

  async function handleNotifTimePress() {
    if (notifPermission === 'denied') {
      Alert.alert('알림 권한 필요', '알림을 받으려면 설정에서 알림 권한을 허용해 주세요.', [
        { text: '취소', style: 'cancel' },
        { text: '설정 열기', onPress: openSettings },
      ]);
      return;
    }
    if (notifPermission === 'undetermined') {
      const granted = await requestNotificationPermission();
      const newPerm = granted ? 'granted' : 'denied';
      setNotifPermission(newPerm);
      if (!granted) {
        Alert.alert('알림 권한 필요', '알림을 받으려면 설정에서 알림 권한을 허용해 주세요.', [
          { text: '취소', style: 'cancel' },
          { text: '설정 열기', onPress: openSettings },
        ]);
        return;
      }
    }
    setShowTimePicker(true);
  }

  async function handleTimeConfirm() {
    setShowTimePicker(false);
    const d = pickerDateRef.current;
    const newTime = { hour: d.getHours(), minute: d.getMinutes() };
    setNotifTime(newTime);
    try {
      await saveNotificationTime(newTime);
      await scheduleDailyNotification(newTime.hour, newTime.minute);
    } catch (error) {
      logger.warn('notification.schedule.failed', toLogError(error));
      Alert.alert('오류', '알림 설정에 실패했어요. 다시 시도해 주세요.');
    }
  }

  async function handleClearCache() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm('저장된 임시 데이터를 모두 삭제할까요?\n다음 실행 시 서버에서 다시 불러옵니다.');
      if (!confirmed) return;
      try {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(isCacheKey);
        if (cacheKeys.length > 0) {
          await AsyncStorage.multiRemove(cacheKeys);
        }
        window.alert('캐시를 비웠어요');
      } catch {
        window.alert('캐시를 비우지 못했어요');
      }
      return;
    }

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
      openURL(IOS_REVIEW_URL);
    } else if (Platform.OS === 'android') {
      Alert.alert('리뷰 남기기', 'iOS 앱 출시 후 이용할 수 있어요 🐾');
    } else {
      setShowWebReviewModal(true);
    }
  }

  function handleFeedbackMail() {
    setShowWebReviewModal(false);
    const href = buildFeedbackMailtoHref();
    Linking.openURL(href).catch(() => {
      if (typeof window !== 'undefined') {
        window.alert(`메일 앱을 열 수 없어요.\n\n${FEEDBACK_EMAIL} 으로 직접 보내주세요.`);
      } else {
        Alert.alert('오류', `메일 앱을 열 수 없어요.\n${FEEDBACK_EMAIL} 으로 직접 보내주세요.`);
      }
    });
  }

  function handleDonation() {
    showConfirm(
      '꼬리 응원하기',
      '17년 함께한 반려견을 떠나보낸 경험으로 꼬리를 만들고 있어요.\n\n후원은 선택사항이며 앱 기능에 영향을 주지 않아요.',
      () => openURL(DONATION_URL),
      { confirmText: '토스 열기', cancelText: '닫기' },
    );
  }

  async function performLogout() {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error) {
      logger.warn('settings.logout.failed', toLogError(error));
      setIsLoggingOut(false);
    }
  }

  async function performDeleteAccount() {
    if (isDeletingAccount) return;
    setIsDeletingAccount(true);
    try {
      await deleteAccount();
    } catch (error) {
      setIsDeletingAccount(false);
      const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
      const message = isNetworkError
        ? '네트워크 오류가 발생했어요.\n연결을 확인한 뒤 다시 시도해 주세요.'
        : error instanceof Error
          ? error.message
          : '탈퇴 처리 중 오류가 발생했어요. 다시 시도해 주세요.';
      showAlert('탈퇴 실패', message);
    }
  }

  const DELETE_ACCOUNT_MESSAGE =
    '탈퇴하면 다음 항목이 처리됩니다.\n\n' +
    '• 모든 개인정보가 삭제 또는 익명화됩니다.\n' +
    '• 반려동물 정보, 기록, 사진은 삭제 처리됩니다.\n' +
    '• 삭제된 데이터는 복구할 수 없습니다.\n' +
    '• 가족공유 기능 도입 시 공유 데이터에 영향이 있을 수 있습니다.\n' +
    '• Google/Kakao 계정 자체는 삭제되지 않습니다.\n' +
    '• 같은 계정으로 재가입은 가능합니다.';

  function handleDeleteAccount() {
    if (isDeletingAccount) return;
    showConfirm(
      '회원 탈퇴',
      DELETE_ACCOUNT_MESSAGE,
      () => { void performDeleteAccount(); },
      { confirmText: '탈퇴하기', confirmStyle: 'destructive' },
    );
  }

  function handleLogout() {
    if (isLoggingOut) return;
    showConfirm(
      '로그아웃할까요?',
      '다시 사용하려면 로그인이 필요해요',
      () => { void performLogout(); },
      { confirmText: '로그아웃' },
    );
  }

  async function handleWebNotifPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'denied') {
      window.alert('알림이 차단되어 있어요.\n브라우저 주소창의 자물쇠 아이콘을 탭한 뒤 알림을 허용해 주세요.');
      return;
    }
    if (Notification.permission === 'granted') return;
    try {
      const result = await Notification.requestPermission();
      setWebNotifPerm(result as WebNotifPerm);
    } catch {
      // 일부 브라우저에서 Promise 방식 미지원
    }
  }

  function handleWebCameraInfo() {
    window.alert('카메라가 차단되어 있어요.\n브라우저 주소창의 자물쇠 아이콘을 탭한 뒤 카메라를 허용해 주세요.');
  }

  async function handleWag() {
    const next = wagCount + 1;
    setWagCount(next);
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const msgs = ['🐾 꼬리가 흔들려요!', '🐾🐾 더 빠르게!', '🐾🐾🐾 멈출 수가 없어요!!'];
    const msg = msgs[Math.min(next - 1, msgs.length - 1)];
    showAlert('', msg);
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <GroupTitle label="알림" />
      <Card>
        {Platform.OS === 'web' ? (
          <>
            <Row
              icon={<Clock size={20} color={colors.textQuaternary} />}
              label="일일 기록 알림"
              desc="앱에서 이용할 수 있어요"
              disabled
            />
            <Row
              icon={<Bell size={20} color={colors.textSecondary} />}
              label="알림 권한"
              desc={getWebNotifDesc(webNotifPerm)}
              onPress={
                webNotifPerm === 'default' || webNotifPerm === 'denied'
                  ? () => { void handleWebNotifPermission(); }
                  : undefined
              }
              last
            />
          </>
        ) : (
          <>
            <Row
              icon={<Clock size={20} color={colors.textSecondary} />}
              label="일일 기록 알림"
              desc={
                notifPermission === 'granted'
                  ? formatNotifTime(notifTime.hour, notifTime.minute)
                  : '알림을 받으려면 권한 허용이 필요해요'
              }
              onPress={() => { void handleNotifTimePress(); }}
            />
            <Row
              icon={<Bell size={20} color={colors.textSecondary} />}
              label="알림 권한"
              desc="시스템 설정 열기"
              onPress={openSettings}
              last
            />
          </>
        )}
      </Card>

      <GroupTitle label="권한" />
      <Card>
        {Platform.OS === 'web' ? (
          <>
            <Row
              icon={<Camera size={20} color={colors.textSecondary} />}
              label="카메라 권한"
              desc={getWebCameraDesc(webCameraPerm)}
              onPress={webCameraPerm === 'denied' ? handleWebCameraInfo : undefined}
            />
            <Row
              icon={<ImageIcon size={20} color={colors.textSecondary} />}
              label="사진 접근 권한"
              desc="파일 선택창에서 선택한 사진만 접근해요"
              last
            />
          </>
        ) : (
          <>
            <Row icon={<Camera size={20} color={colors.textSecondary} />} label="카메라 권한" desc="시스템 설정 열기" onPress={openSettings} />
            <Row icon={<ImageIcon size={20} color={colors.textSecondary} />} label="사진 접근 권한" desc="시스템 설정 열기" onPress={openSettings} last />
          </>
        )}
      </Card>

      <GroupTitle label="데이터" />
      <Card>
        <Row icon={<Database size={20} color={colors.textQuaternary} />} label="데이터 백업 / 내보내기" right={<ComingSoonBadge />} disabled />
        <Row icon={<Database size={20} color={colors.textQuaternary} />} label="데이터 가져오기" right={<ComingSoonBadge />} disabled />
        <Row icon={<Trash2 size={20} color={colors.textSecondary} />} label="캐시 비우기" onPress={handleClearCache} last />
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
        <Row icon={<Heart size={20} color={colors.textSecondary} />} label="꼬리 응원하기" desc="개발자에게 간식 사주기" onPress={handleDonation} />
        <Row icon={<PawPrint size={20} color={colors.textSecondary} />} label="꼬리 흔들게 하기 🐾" onPress={handleWag} last />
      </Card>

      <GroupTitle label="계정" />
      <Card>
        <Row
          icon={<LogOut size={20} color={colors.textSecondary} />}
          label="로그아웃"
          desc={isLoggingOut ? '로그아웃 중이에요' : undefined}
          right={isLoggingOut ? <ActivityIndicator color={colors.textSecondary} /> : undefined}
          onPress={handleLogout}
          disabled={isLoggingOut || isDeletingAccount}
        />
        <Row
          icon={<UserX size={20} color={colors.danger} />}
          label="회원 탈퇴"
          desc={isDeletingAccount ? '탈퇴 처리 중이에요' : '계정 및 모든 데이터 삭제'}
          right={isDeletingAccount ? <ActivityIndicator color={colors.danger} /> : undefined}
          onPress={handleDeleteAccount}
          disabled={isDeletingAccount || isLoggingOut}
          destructive
          last
        />
      </Card>
      {/* 알림 시간 선택 모달 */}
      {Platform.OS !== 'web' && (
        <Modal
          visible={showTimePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={s.modalOverlay}>
            <View style={s.timePickerSheet}>
              <View style={s.timePickerHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)} style={s.timePickerHeaderBtn}>
                  <Text style={s.timePickerCancel}>취소</Text>
                </TouchableOpacity>
                <Text style={s.timePickerTitle}>알림 시간</Text>
                <TouchableOpacity onPress={() => { void handleTimeConfirm(); }} style={s.timePickerHeaderBtn}>
                  <Text style={s.timePickerDone}>완료</Text>
                </TouchableOpacity>
              </View>
              {DateTimePicker && (
                <DateTimePicker
                  value={pickerDateRef.current}
                  mode="time"
                  display="spinner"
                  locale="ko-KR"
                  onChange={(_: unknown, date?: Date) => {
                    if (date) pickerDateRef.current = date;
                  }}
                />
              )}
            </View>
          </View>
        </Modal>
      )}

      <Modal
        visible={showWebReviewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWebReviewModal(false)}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowWebReviewModal(false)}
        >
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>꼬리가 마음에 드셨나요?</Text>
            <Text style={s.modalSubtitle}>한 줄의 리뷰나 의견이 큰 도움이 돼요.</Text>
            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.modalRow}
                activeOpacity={0.7}
                onPress={() => { setShowWebReviewModal(false); openURL(IOS_REVIEW_URL); }}
              >
                <Star size={18} color={colors.textSecondary} />
                <Text style={s.modalRowLabel}>App Store 리뷰</Text>
                <ChevronRight size={16} color={colors.textQuaternary} />
              </TouchableOpacity>
              <View style={s.divider} />
              <TouchableOpacity
                style={s.modalRow}
                activeOpacity={0.7}
                onPress={() => { setShowWebReviewModal(false); openURL(ANDROID_REVIEW_URL); }}
              >
                <Star size={18} color={colors.textSecondary} />
                <Text style={s.modalRowLabel}>Google Play 리뷰</Text>
                <ChevronRight size={16} color={colors.textQuaternary} />
              </TouchableOpacity>
              <View style={s.divider} />
              <TouchableOpacity style={s.modalRow} activeOpacity={0.7} onPress={handleFeedbackMail}>
                <MessageCircle size={18} color={colors.textSecondary} />
                <Text style={s.modalRowLabel}>의견 보내기</Text>
                <ChevronRight size={16} color={colors.textQuaternary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.modalCloseBtn} activeOpacity={0.7} onPress={() => setShowWebReviewModal(false)}>
              <Text style={s.modalCloseBtnText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  rowLabelDestructive: { color: colors.danger },
  rowDesc: { fontSize: 12, color: colors.textTertiary, marginTop: 1 },

  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: 52, // 16 padding + 24 icon + 12 gap
  },

  badge: {
    backgroundColor: colors.warningBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '600', color: colors.warning },

  versionText: { fontSize: 13, color: colors.textTertiary },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },

  timePickerSheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
  },
  timePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  timePickerHeaderBtn: {
    minWidth: 40,
  },
  timePickerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  timePickerCancel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  timePickerDone: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'right',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
    paddingTop: spacing.xl,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  modalActions: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  modalRowLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  modalCloseBtn: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
