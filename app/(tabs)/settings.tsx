import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '../../constants/theme';
import { initDeviceId } from '../../lib/api/deviceId';
import { petApi, PetRequest } from '../../lib/api/pet';

type LogEntry = { label: string; result: unknown; error?: boolean };

export default function SettingsScreen() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('pet-care:device-id').then(setDeviceId);
  }, []);

  function addLog(label: string, result: unknown, error = false) {
    setLogs((prev) => [{ label, result, error }, ...prev]);
  }

  async function handleInitDevice() {
    try {
      await initDeviceId();
      const id = await AsyncStorage.getItem('pet-care:device-id');
      setDeviceId(id);
      addLog('initDeviceId()', { deviceId: id });
    } catch (e) {
      addLog('initDeviceId()', String(e), true);
    }
  }

  async function handleGetPets() {
    try {
      const result = await petApi.getPets();
      addLog('getPets()', result);
    } catch (e) {
      addLog('getPets()', String(e), true);
    }
  }

  async function handleCreatePet() {
    const body: PetRequest = {
      name: '테스트 강아지',
      species: 'dog',
      breed: '믹스견',
      birthDate: '2022-03-15',
      gender: 'male',
      weightKg: 5.2,
    };
    try {
      const result = await petApi.createPet(body);
      addLog('createPet()', result);
    } catch (e) {
      addLog('createPet()', String(e), true);
    }
  }

  function handleClearLogs() {
    Alert.alert('로그 지우기', '로그를 모두 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => setLogs([]) },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>API 테스트</Text>

      <View style={styles.deviceBox}>
        <Text style={styles.deviceLabel}>저장된 Device ID</Text>
        <Text style={styles.deviceId} selectable>
          {deviceId ?? '없음'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device</Text>
        <Btn label="initDeviceId()" onPress={handleInitDevice} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pet</Text>
        <Btn label="getPets()" onPress={handleGetPets} />
        <Btn label="createPet() — 테스트 강아지" onPress={handleCreatePet} />
      </View>

      <View style={styles.logHeader}>
        <Text style={styles.sectionTitle}>응답 로그</Text>
        {logs.length > 0 && (
          <TouchableOpacity onPress={handleClearLogs}>
            <Text style={styles.clearBtn}>지우기</Text>
          </TouchableOpacity>
        )}
      </View>

      {logs.length === 0 && (
        <Text style={styles.empty}>버튼을 눌러 API를 호출하세요.</Text>
      )}

      {logs.map((entry, i) => (
        <View key={i} style={[styles.logEntry, entry.error && styles.logError]}>
          <Text style={styles.logLabel}>{entry.label}</Text>
          <Text style={styles.logValue} selectable>
            {JSON.stringify(entry.result, null, 2)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

function Btn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.btn} onPress={onPress}>
      <Text style={styles.btnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 60, gap: 8 },
  title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },

  deviceBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 4,
  },
  deviceLabel: { fontSize: 12, color: colors.textSecondary },
  deviceId: { fontSize: 13, color: colors.textPrimary, fontFamily: 'monospace' },

  section: { gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },

  btn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 13,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  clearBtn: { fontSize: 13, color: colors.primary },

  empty: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 20 },

  logEntry: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    gap: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  logError: { borderLeftColor: '#E85C5C' },
  logLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  logValue: { fontSize: 12, color: colors.textPrimary, fontFamily: 'monospace' },
});
