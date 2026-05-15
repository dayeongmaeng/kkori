import { pickImage } from '../../lib/imagePickerHelper';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Image } from 'expo-image';
import { colors, radius, spacing } from '../../constants/theme';
import { useAutoSave } from '../../hooks/useAutoSave';
import { getCurrentPetId, getPet, savePet, setCurrentPetId } from '../../lib/storage';
import { Pet } from '../../lib/types';
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

// 웹 fallback: 년/월/일 select 3개
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

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function ProfileScreen() {
  const [petId, setPetId] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [neutered, setNeutered] = useState(false);
  const [medicalNotes, setMedicalNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [isLoaded, setIsLoaded] = useState(false);

  // 날짜 피커 상태
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(new Date(2020, 0, 1));

  // petId/createdAt은 자동저장 시 최신값 참조용 ref
  const petIdRef = useRef<string | null>(null);
  const createdAtRef = useRef<string | null>(null);
  petIdRef.current = petId;
  createdAtRef.current = createdAt;

  const profileData = { name, breed, birthDate, weightKg, neutered, medicalNotes, photoUri };

  const autoSavePet = useCallback(async (data: typeof profileData) => {
    if (!data.name.trim() || !data.breed.trim() || !data.birthDate.trim()) return;
    const weight = parseFloat(data.weightKg);
    if (isNaN(weight) || weight <= 0) return;

    const now = new Date().toISOString();
    const id = petIdRef.current ?? generateId();
    const savedAt = createdAtRef.current ?? now;
    const pet: Pet = {
      id,
      species: 'dog',
      name: data.name.trim(),
      breed: data.breed.trim(),
      birthDate: data.birthDate.trim(),
      weightKg: weight,
      neutered: data.neutered,
      medicalNotes: data.medicalNotes.trim() || undefined,
      photoUri: data.photoUri,
      caregiverIds: [],
      createdAt: savedAt,
    };
    await savePet(pet);
    await setCurrentPetId(pet.id);
    if (!petIdRef.current) {
      setPetId(pet.id);
      setCreatedAt(pet.createdAt);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { status: saveStatus } = useAutoSave(
    profileData,
    autoSavePet,
    { enabled: isLoaded && name.trim().length > 0 }
  );

  useEffect(() => {
    async function loadPet() {
      const currentId = await getCurrentPetId();
      if (currentId) {
        const saved = await getPet(currentId);
        if (saved) {
          setPetId(saved.id);
          setCreatedAt(saved.createdAt);
          setName(saved.name);
          setBreed(saved.breed);
          setBirthDate(saved.birthDate);
          setWeightKg(String(saved.weightKg));
          setNeutered(saved.neutered);
          setMedicalNotes(saved.medicalNotes ?? '');
          const uri = saved.photoUri;
          if (uri && !uri.startsWith('blob:') && !uri.startsWith('file://')) {
            setPhotoUri(uri);
          }
        }
      }
      setIsLoaded(true);
    }
    loadPet();
  }, []);

  async function handlePickImage() {
    const dataUri = await pickImage({ allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!dataUri) return;
    setPhotoUri(dataUri);
  }

  return (
    <View style={styles.container}>
      <SaveIndicator status={saveStatus} />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.titleRow}>
        <Text style={styles.title}>반려동물 등록</Text>
      </View>

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
    paddingBottom: 200,
  },
  titleRow: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
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
});
