import { useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PhotoShareResponse, photoApi } from '../../lib/api/photo';
import { WEB_BASE_URL } from '../../lib/api/client';
import { colors, radius, spacing } from '../../constants/theme';

const logoImage = require('../../assets/logo.png');

function formatDateKorean(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

function getImageUrl(photo: PhotoShareResponse) {
  return photo.mediumUrl ?? photo.thumbnailUrl;
}

export default function SharedPhotoScreen() {
  const { externalId } = useLocalSearchParams<{ externalId: string }>();
  const [photo, setPhoto] = useState<PhotoShareResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function load() {
      if (!externalId) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setHasError(false);
      try {
        const result = await photoApi.getSharedPhoto(externalId);
        setPhoto(result);
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [externalId]);

  const imageUrl = photo ? getImageUrl(photo) : undefined;
  const title = photo ? `${photo.petName}의 하루 한 장` : '꼬리 사진 공유';
  const description = photo?.caption ?? '반려동물의 소중한 순간을 꼬리에서 공유했어요.';

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <Head>
          <title>꼬리 사진 공유</title>
        </Head>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.statusText}>사진을 불러오고 있어요</Text>
      </SafeAreaView>
    );
  }

  if (hasError || !photo) {
    return (
      <SafeAreaView style={styles.center}>
        <Head>
          <title>사진을 찾을 수 없어요 | 꼬리</title>
        </Head>
        <Text style={styles.notFoundIcon}>🔍</Text>
        <Text style={styles.errorTitle}>사진을 찾을 수 없어요</Text>
        <Text style={styles.errorDescription}>공유 링크가 만료되었거나 삭제된 사진일 수 있어요.</Text>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => Linking.openURL(WEB_BASE_URL)}
          activeOpacity={0.82}
        >
          <Text style={styles.secondaryButtonText}>꼬리 홈으로</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Head>
        <title>{title} | 꼬리</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {imageUrl ? <meta property="og:image" content={imageUrl} /> : null}
      </Head>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.shell}>
          <View style={styles.topBar}>
            <View>
              <Image source={logoImage} style={styles.logoImage} contentFit="contain" />
              <Text style={styles.dateText}>{formatDateKorean(photo.date)}</Text>
            </View>
            <View style={styles.shareBadge}>
              <Text style={styles.shareBadgeText}>꼬리에서 공유됨</Text>
            </View>
          </View>

          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={[styles.photo, styles.emptyPhoto]}>
              <Text style={styles.emptyPhotoText}>사진을 불러올 수 없어요</Text>
            </View>
          )}

          <View style={styles.content}>
            <Text style={styles.title}>{photo.petName}의 하루 한 장</Text>
            {photo.edited && (
              <View style={styles.editedBadge}>
                <Text style={styles.editedBadgeText}>수정됨</Text>
              </View>
            )}
            {photo.caption ? (
              <Text style={styles.caption}>{photo.caption}</Text>
            ) : (
              <Text style={styles.emptyCaption}>캡션이 없는 사진이에요.</Text>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>반려동물의 하루를 꼬리에서 기록하고 있어요.</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => Linking.openURL(WEB_BASE_URL)}
              activeOpacity={0.82}
            >
              <Text style={styles.primaryButtonText}>꼬리에서 기록하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  statusText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  notFoundIcon: {
    fontSize: 44,
  },
  errorTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  errorDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-start',
    paddingVertical: Platform.OS === 'web' ? spacing.md : 0,
    paddingHorizontal: Platform.OS === 'web' ? spacing.md : 0,
  },
  shell: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        borderRadius: 24,
        boxShadow: '0 16px 48px rgba(25, 31, 40, 0.14)',
      },
      default: {},
    }),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingLeft: spacing.sm,
    paddingRight: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  logoImage: {
    width: 82,
    height: 28,
  },
  dateText: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  shareBadge: {
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  shareBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceAlt,
  },
  emptyPhoto: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPhotoText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  title: {
    fontSize: 21,
    fontWeight: '900',
    color: colors.textPrimary,
    lineHeight: 28,
  },
  editedBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  editedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
  },
  caption: {
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
  },
  emptyCaption: {
    fontSize: 15,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.lg,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textTertiary,
  },
  primaryButton: {
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textOnPrimary,
  },
  secondaryButton: {
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textOnPrimary,
  },
});
