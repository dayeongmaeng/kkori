import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../constants/theme';

const dogLogo = require('../assets/dog-logo.svg');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Page {
  title: string;
  body: string;
}

const PAGES: Page[] = [
  {
    title: '특별한 날보다\n평범한 오늘을\n남길 수 있도록',
    body: '평범한 오늘이\n언젠가 가장 소중한 기억이 될 수 있으니까.\n\n꼬리는 우리 아이의 하루를\n기록하고 기억하는 공간입니다.',
  },
  {
    title: '기록이 필요한 순간이\n생각보다 자주 찾아옵니다.',
    body: '병원에서\n"일주일 전엔 어땠나요?"\n라는 질문을 받았을 때.\n\n기억에 의존하지 않도록\n꼬리는 기록을 남길 수 있게 만들었습니다.',
  },
  {
    title: '일상과 건강을\n함께 기록하세요.',
    body: '식사, 산책, 배변, 컨디션까지.\n\n작은 변화도 기록해두면\n나중에 우리 아이를 이해하는 데 도움이 됩니다.',
  },
  {
    title: '하루 한 장이면\n충분해요.',
    body: '특별한 날이 아니어도 괜찮아요.\n\n오늘의 모습 한 장,\n오늘의 기록 하나.\n\n그것만으로도 충분합니다.',
  },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Page>>(null);
  const isLast = currentIndex === PAGES.length - 1;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  );

  function handleNext() {
    if (isLast) {
      onComplete();
      return;
    }
    flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
  }

  const renderItem: ListRenderItem<Page> = ({ item, index }) => (
    <View style={[styles.page, { width: SCREEN_WIDTH }]}>
      <View style={styles.decorRow}>
        <View style={[styles.decorCircle, styles.decorCircleSmall, { opacity: 0.4 + index * 0.15 }]} />
        <View style={[styles.decorCircle, styles.decorCircleLarge]} />
        <View style={[styles.decorCircle, styles.decorCircleSmall, { opacity: 0.3 + index * 0.1 }]} />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.body}>{item.body}</Text>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, spacing.xl) },
      ]}
    >
      <View style={styles.header}>
        <Image source={dogLogo} style={styles.logo} contentFit="contain" />
        {!isLast ? (
          <TouchableOpacity
            onPress={onComplete}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.skip}>건너뛰기</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={PAGES}
        renderItem={renderItem}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        style={styles.flatList}
      />

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {PAGES.map((_, i) => (
            <View
              key={i}
              style={[styles.indicator, i === currentIndex && styles.indicatorActive]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{isLast ? '시작하기' : '다음'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  logo: {
    width: 40,
    height: 40,
  },
  skip: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  skipPlaceholder: {
    width: 48,
  },
  flatList: {
    flex: 1,
  },
  page: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  decorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  decorCircle: {
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
  },
  decorCircleSmall: {
    width: 10,
    height: 10,
  },
  decorCircleLarge: {
    width: 18,
    height: 18,
    backgroundColor: colors.primary,
    opacity: 0.6,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 36,
  },
  body: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  bottom: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  indicatorActive: {
    width: 20,
    backgroundColor: colors.primary,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
});
