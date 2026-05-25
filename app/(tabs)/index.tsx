import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, ScrollView, StyleSheet, View } from 'react-native';
import AiReportPreview from '../../components/AiReportPreview';
import EmptyPetState from '../../components/EmptyPetState';
import HomeConditionChart from '../../components/HomeConditionChart';
import HomeTodayLogCard from '../../components/HomeTodayLogCard';
import HomeProfileCard from '../../components/HomeProfileCard';
import { colors, spacing } from '../../constants/theme';
import { useDate } from '../../contexts/DateContext';
import { useCurrentPet } from '../../contexts/PetContext';
import { logApi, LogResponse } from '../../lib/api/log';
import { PetResponse } from '../../lib/api/pet';
import { getCachedLogByDate, getCachedLogs, setCachedLogs } from '../../lib/cache/log';
import { getCachedPet } from '../../lib/cache/pet';

function get6DaysAgo(today: string): string {
  const d = new Date(today + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 6);
  return d.toISOString().slice(0, 10);
}

export default function HomeScreen() {
  const today = useDate();
  const { currentPet } = useCurrentPet();
  const petIdFromContext = currentPet?.externalId ?? null;

  const [pet, setPet] = useState<PetResponse | null>(null);
  const [todayLog, setTodayLog] = useState<LogResponse | null>(null);
  const [recentLogs, setRecentLogs] = useState<LogResponse[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadData = useCallback(async () => {
    const sevenDaysAgo = get6DaysAgo(today);
    const petId = petIdFromContext;

    if (!petId) {
      setPet(null);
      setTodayLog(null);
      setRecentLogs([]);
      setLoaded(true);
      return;
    }

    // 1단계: 캐시 즉시 표시
    const [cachedPet, cachedLog, cachedLogs] = await Promise.all([
      getCachedPet(petId),
      getCachedLogByDate(petId, today),
      getCachedLogs(petId),
    ]);

    if (cachedPet) setPet(cachedPet);
    setTodayLog(cachedLog);
    setRecentLogs(cachedLogs.filter((l) => l.date >= sevenDaysAgo && l.date <= today));
    setLoaded(true);

    // 2단계: 서버 갱신 (백그라운드)
    try {
      const serverLogs = await logApi.getLogs({ petExternalId: petId });
      await setCachedLogs(petId, serverLogs);

      const serverTodayLog = serverLogs.find((l) => l.date === today) ?? null;
      setTodayLog(serverTodayLog);
      setRecentLogs(serverLogs.filter((l) => l.date >= sevenDaysAgo && l.date <= today));
    } catch {
      // 오프라인 — 캐시 유지
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, petIdFromContext]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') loadData();
    });
    return () => sub.remove();
  }, [loadData]);

  // 반려동물 전환 시 이전 데이터 즉시 클리어
  const isMountedRef = useRef(false);
  useEffect(() => {
    if (!isMountedRef.current) { isMountedRef.current = true; return; }
    setPet(null); setTodayLog(null); setRecentLogs([]); setLoaded(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petIdFromContext]);

  if (!loaded) return null;

  if (!pet) {
    return (
      <View style={styles.container}>
        <EmptyPetState />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <HomeProfileCard pet={pet} />
      <HomeTodayLogCard
        todayLog={todayLog ?? undefined}
        onTapAdd={() => router.navigate('/log')}
        onTapView={() => router.navigate('/log')}
      />
      <HomeConditionChart logs={recentLogs} today={today} />
      <AiReportPreview petName={pet.name} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
});
