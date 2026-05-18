import { pickImage } from '../../lib/imagePickerHelper';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Image } from 'expo-image';
import { colors, radius, spacing } from '../../constants/theme';
import { petApi, PetResponse } from '../../lib/api/pet';
import {
  getCachedCurrentPetId,
  getCachedPetPhoto,
  getCachedPets,
  setCachedCurrentPetId,
  setCachedPetPhoto,
  setCachedPets,
  upsertCachedPet,
} from '../../lib/cache/pet';
import { useCurrentPet } from '../../contexts/PetContext';
import { SaveStatus } from '../../hooks/useAutoSave';
import SaveIndicator from '../../components/SaveIndicator';

let DateTimePicker: any = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch {
  DateTimePicker = null;
}

const today = new Date();
const minDate = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
const maxDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

function formatBirthDate(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}년 ${m}월 ${d}일`;
}

function dateToStorage(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function storageToDate(s: string): Date | null {
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return isNaN(d.getTime()) ? null : d;
}

function WebDatePicker({
  value,
  onChange,
}: {
  value: Date;
  onChange: (date: Date) => void;
}) {
  const years = Array.from({ length: 31 }, (_, i) => today.getFullYear() - 30 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = new Date(value.getFullYear(), value.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function update(y: number, m: number, d: number) {
    const maxD = new Date(y, m, 0).getDate();
    onChange(new Date(y, m - 1, Math.min(d, maxD)));
  }

  return (
    <View style={webPickerStyles.row}>
      <select
        value={value.getFullYear()}
        onChange={e => update(Number(e.target.value), value.getMonth() + 1, value.getDate())}
        style={webPickerStyles.select as any}
      >
        {years.map(y => <option key={y} value={y}>{y}년</option>)}
      </select>
      <select
        value={value.getMonth() + 1}
        onChange={e => update(value.getFullYear(), Number(e.target.value), value.getDate())}
        style={webPickerStyles.select as any}
      >
        {months.map(m => <option key={m} value={m}>{m}월</option>)}
      </select>
      <select
        value={value.getDate()}
        onChange={e => update(value.getFullYear(), value.getMonth() + 1, Number(e.target.value))}
        style={webPickerStyles.select as any}
      >
        {days.map(d => <option key={d} value={d}>{d}일</option>)}
      </select>
    </View>
  );
}

const webPickerStyles = {
  row: { flexDirection: 'row' as const, gap: 8, justifyContent: 'center' as const },
  select: {
    flex: 1,
    fontSize: 16,
    padding: 8,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.surfaceAlt,
    color: colors.textPrimary,
  },
};

export default function ProfileScreen() {
  const { setCurrentPet } = useCurrentPet();
  const [externalId, setExternalId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [neutered, setNeutered] = useState(false);
  const [medicalNotes, setMedicalNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  const [isSaving, setIsSaving] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(new Date(2020, 0, 1));

  const [indicatorStatus, setIndicatorStatus] = useState<SaveStatus>('idle');
  const indicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function fillForm(pet: PetResponse) {
    setExternalId(pet.externalId);
    setName(pet.name);
    setBreed(pet.breed ?? '');
    setBirthDate(pet.birthDate ?? '');
    setWeightKg(pet.weightKg !== undefined ? String(pet.weightKg) : '');
    setNeutered(pet.neutered ?? false);
    setMedicalNotes(pet.medicalNotes ?? '');
    if (pet.photoBase64) setPhotoUri(pet.photoBase64);
  }

  function showError() {
    if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current);
    setIndicatorStatus('error');
    indicatorTimerRef.current = setTimeout(() => setIndicatorStatus('idle'), 2200);
  }

  useEffect(() => {
    async function load() {
      // 1단계: 캐시에서 즉시 로드
      const cachedId = await getCachedCurrentPetId();
      if (cachedId) {
        const cached = await getCachedPets();
        const pet = cached.find((p) => p.externalId === cachedId);
        if (pet) {
          fillForm(pet);
          const photo = await getCachedPetPhoto(cachedId);
          if (photo) setPhotoUri(photo);
        }
      }

      // 2단계: 서버에서 최신 데이터 fetch (백그라운드)
      try {
        const serverPets = await petApi.getPets();
        await setCachedPets(serverPets);

        const targetId = cachedId;
        if (targetId) {
          const serverPet = serverPets.find((p) => p.externalId === targetId);
          if (serverPet) fillForm(serverPet);
        }
      } catch {
        // 오프라인 또는 서버 에러 — 캐시 유지, 에러 표시 없음
      }
    }
    load();
  }, []);

  async function handlePickImage() {
    const dataUri = await pickImage({ allowsEditing: true, aspect: [1, 1] });
    if (!dataUri) return;
    setPhotoUri(dataUri);
  }

  async function handleSave() {
    if (!name.trim() || !breed.trim() || !birthDate.trim() || !weightKg.trim()) {
      showError();
      return;
    }
    const weight = parseFloat(weightKg);
    if (isNaN(weight) || weight <= 0) {
      showError();
      return;
    }

    try {
      if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current);
      setIndicatorStatus('saving');
      setIsSaving(true);

      const body = {
        name: name.trim(),
        species: 'dog',
        breed: breed.trim(),
        birthDate: birthDate.trim(),
        weightKg: weight,
        neutered,
        medicalNotes: medicalNotes.trim() || undefined,
        photoBase64: photoUri,
      };

      const response = externalId
        ? await petApi.updatePet(externalId, body)
        : await petApi.createPet(body);

      // 캐시 업데이트
      await upsertCachedPet(response);
      await setCachedCurrentPetId(response.externalId);
      if (photoUri) await setCachedPetPhoto(response.externalId, photoUri);

      setExternalId(response.externalId);
      setCurrentPet(response);

      setIndicatorStatus('saved');
      indicatorTimerRef.current = setTimeout(() => {
        setIndicatorStatus('idle');
        router.replace('/(tabs)/');
      }, 1500);
    } catch (e) {
      console.error('[ProfileScreen] 서버 저장 실패:', e);
      setIndicatorStatus('idle');
      Alert.alert('저장 실패', '서버 연결을 확인해주세요.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        {/* 사진 */}
        <TouchableOpacity style={styles.photoWrapper} onPress={handlePickImage}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderIcon}>📷</Text>
              <Text style={styles.photoPlaceholderText}>사진 추가</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 이름 */}
        <View style={styles.field}>
          <Text style={styles.label}>이름 *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="강아지 이름"
            placeholderTextColor={colors.textQuaternary}
          />
        </View>

        {/* 견종 */}
        <View style={styles.field}>
          <Text style={styles.label}>견종 *</Text>
          <TextInput
            style={styles.input}
            value={breed}
            onChangeText={setBreed}
            placeholder="예: 말티즈, 포메라니안"
            placeholderTextColor={colors.textQuaternary}
          />
        </View>

        {/* 생일 */}
        <View style={styles.field}>
          <Text style={styles.label}>생일 *</Text>
          <TouchableOpacity
            style={[styles.input, styles.dateButton]}
            onPress={() => {
              const parsed = storageToDate(birthDate);
              setPickerDate(parsed ?? new Date(2020, 0, 1));
              setDatePickerVisible(true);
            }}
          >
            <Text style={birthDate ? styles.dateText : styles.datePlaceholder}>
              {birthDate ? (() => {
                const d = storageToDate(birthDate);
                return d ? formatBirthDate(d) : birthDate;
              })() : '생일 선택'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 날짜 선택 모달 */}
        <Modal
          visible={datePickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setDatePickerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                  <Text style={styles.modalCancel}>취소</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>생일 선택</Text>
                <TouchableOpacity
                  onPress={() => {
                    setBirthDate(dateToStorage(pickerDate));
                    setDatePickerVisible(false);
                  }}
                >
                  <Text style={styles.modalDone}>완료</Text>
                </TouchableOpacity>
              </View>

              {Platform.OS === 'web' ? (
                <View style={styles.webPickerWrapper}>
                  <WebDatePicker value={pickerDate} onChange={setPickerDate} />
                </View>
              ) : DateTimePicker ? (
                <DateTimePicker
                  value={pickerDate}
                  mode="date"
                  display="spinner"
                  locale="ko-KR"
                  minimumDate={minDate}
                  maximumDate={maxDate}
                  onChange={(_: any, date?: Date) => {
                    if (date) setPickerDate(date);
                  }}
                />
              ) : null}
            </View>
          </View>
        </Modal>

        {/* 체중 */}
        <View style={styles.field}>
          <Text style={styles.label}>체중 *</Text>
          <View style={styles.weightRow}>
            <TextInput
              style={[styles.input, styles.weightInput]}
              value={weightKg}
              onChangeText={setWeightKg}
              placeholder="0.0"
              placeholderTextColor={colors.textQuaternary}
              keyboardType="decimal-pad"
            />
            <Text style={styles.weightUnit}>kg</Text>
          </View>
        </View>

        {/* 중성화 */}
        <View style={styles.field}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>중성화 완료</Text>
            <Switch
              value={neutered}
              onValueChange={setNeutered}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* 건강 메모 */}
        <View style={styles.field}>
          <Text style={styles.label}>건강 메모 (선택)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={medicalNotes}
            onChangeText={setMedicalNotes}
            placeholder="알레르기, 복용 중인 약, 주의사항 등"
            placeholderTextColor={colors.textQuaternary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </KeyboardAwareScrollView>

      {/* 저장 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>{isSaving ? '저장 중...' : '저장'}</Text>
        </TouchableOpacity>
      </View>

      <SaveIndicator
        status={indicatorStatus}
        labels={{
          saving: '서버에 저장 중...',
          saved: '저장되었습니다 ✓',
          error: '필수 항목을 입력해주세요',
        }}
        textColors={{
          saving: 'rgba(255,255,255,0.90)',
          saved: 'rgba(255,255,255,0.90)',
          error: 'rgba(255,255,255,0.90)',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 100,
  },
  photoWrapper: {
    alignSelf: 'center',
    marginBottom: spacing.xxl,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: radius.full,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  field: {
    marginBottom: spacing.lg + 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  weightInput: {
    flex: 1,
  },
  weightUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textarea: {
    height: 120,
    paddingTop: 14,
  },
  dateButton: {
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  datePlaceholder: {
    fontSize: 16,
    color: colors.textQuaternary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalCancel: {
    fontSize: 16,
    color: colors.textTertiary,
  },
  modalDone: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  webPickerWrapper: {
    padding: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
});
