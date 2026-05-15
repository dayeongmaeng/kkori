import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, ScrollView, StyleSheet, Text, View } from 'react-native';
import AiReportPreview from '../../components/AiReportPreview';
import EmptyPetState from '../../components/EmptyPetState';
import HomeConditionChart from '../../components/HomeConditionChart';
import HomeTodayLogCard from '../../components/HomeTodayLogCard';
import HomeProfileCard from '../../components/HomeProfileCard';
import { colors, spacing } from '../../constants/theme';
import { useMidnightRefresh } from '../../hooks/useMidnightRefresh';
import { getCurrentPetId, getDailyLogByDate, getDailyLogs, getPet } from '../../lib/storage';
import { DailyLog, Pet } from '../../lib/types';

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function get6DaysAgoString() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10);
}

export default function HomeScreen() {
  const [pet, setPet] = useState<Pet | null>(null);
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadData = useCallback(async () => {
    const today = getTodayString();
    const sevenDaysAgo = get6DaysAgoString();
    const petId = await getCurrentPetId();

    if (!petId) {
      setPet(null);
      setTodayLog(null);
      setRecentLogs([]);
      setLoaded(true);
      return;
    }

    const [loadedPet, loadedLog, allLogs] = await Promise.all([
      getPet(petId),
      getDailyLogByDate(petId, today),
      getDailyLogs(petId),
    ]);

    setPet(loadedPet);
    setTodayLog(loadedLog);
    setRecentLogs(allLogs.filter((l) => l.date >= sevenDaysAgo && l.date <= today));
    setLoaded(true);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') loadData();
    });
    return () => sub.remove();
  }, [loadData]);

  useMidnightRefresh(loadData);

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
      <HomeConditionChart logs={recentLogs} />
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
