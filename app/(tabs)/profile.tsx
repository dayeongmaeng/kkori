import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import SaveIndicator from "../../components/SaveIndicator";
import { colors, radius, spacing } from "../../constants/theme";
import { useCurrentPet } from "../../contexts/PetContext";
import { SaveStatus } from "../../hooks/useAutoSave";
import { petApi, PetResponse } from "../../lib/api/pet";
import {
  getCachedPetPhoto,
  getCachedPets,
  setCachedCurrentPetId,
  setCachedPetPhoto,
  setCachedPets,
  upsertCachedPet,
} from "../../lib/cache/pet";
import { pickImageUri } from "../../lib/imagePickerHelper";
import {
  ImageUploadState,
  prepareImageForUpload,
  toBase64DataUri,
} from "../../lib/imageUpload";

type Gender = "male" | "female";
type DateField = "birthDate" | "adoptionDate";

let DateTimePicker: any = null;
try {
  DateTimePicker = require("@react-native-community/datetimepicker").default;
} catch {
  DateTimePicker = null;
}

const today = new Date();
const minDate = new Date(1950, 0, 1);
const maxDate = new Date(
  today.getFullYear(),
  today.getMonth(),
  today.getDate() + 1,
);
const dogBreeds = [
  "말티즈",
  "포메라니안",
  "푸들",
  "토이푸들",
  "비숑 프리제",
  "치와와",
  "시츄",
  "요크셔테리어",
  "닥스훈트",
  "웰시코기",
  "프렌치 불도그",
  "비글",
  "시바견",
  "진돗개",
  "리트리버",
  "골든 리트리버",
  "래브라도 리트리버",
  "보더콜리",
  "사모예드",
  "스피츠",
  "슈나우저",
  "말티푸",
  "포메푸",
  "믹스견",
];

function formatBirthDate(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}년 ${m}월 ${d}일`;
}

function dateToStorage(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function storageToDate(s: string): Date | null {
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return isNaN(d.getTime()) ? null : d;
}

function normalizeGender(value: string | null | undefined): Gender | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "male" || normalized === "m" || normalized === "남자")
    return "male";
  if (normalized === "female" || normalized === "f" || normalized === "여자")
    return "female";
  return null;
}

function WebDatePicker({
  value,
  onChange,
}: {
  value: Date;
  onChange: (date: Date) => void;
}) {
  const years = Array.from(
    { length: today.getFullYear() - 1950 + 1 },
    (_, i) => 1950 + i,
  );
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = new Date(
    value.getFullYear(),
    value.getMonth() + 1,
    0,
  ).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function update(y: number, m: number, d: number) {
    const maxD = new Date(y, m, 0).getDate();
    onChange(new Date(y, m - 1, Math.min(d, maxD)));
  }

  return (
    <View style={webPickerStyles.row}>
      <select
        value={value.getFullYear()}
        onChange={(e) =>
          update(Number(e.target.value), value.getMonth() + 1, value.getDate())
        }
        style={webPickerStyles.select as any}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}년
          </option>
        ))}
      </select>
      <select
        value={value.getMonth() + 1}
        onChange={(e) =>
          update(value.getFullYear(), Number(e.target.value), value.getDate())
        }
        style={webPickerStyles.select as any}
      >
        {months.map((m) => (
          <option key={m} value={m}>
            {m}월
          </option>
        ))}
      </select>
      <select
        value={value.getDate()}
        onChange={(e) =>
          update(
            value.getFullYear(),
            value.getMonth() + 1,
            Number(e.target.value),
          )
        }
        style={webPickerStyles.select as any}
      >
        {days.map((d) => (
          <option key={d} value={d}>
            {d}일
          </option>
        ))}
      </select>
    </View>
  );
}

const webPickerStyles = {
  row: {
    flexDirection: "row" as const,
    gap: 8,
    justifyContent: "center" as const,
  },
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
  const { currentPet, setCurrentPet } = useCurrentPet();
  const petIdFromContext = currentPet?.externalId ?? null;
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isCreateMode = mode === "create";
  const [externalId, setExternalId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [birthDate, setBirthDate] = useState("");
  const [birthDateUnknown, setBirthDateUnknown] = useState(false);
  const [adoptionDate, setAdoptionDate] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [neutered, setNeutered] = useState(false);
  const [medicalNotes, setMedicalNotes] = useState("");
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [photoSourceUri, setPhotoSourceUri] = useState<string | undefined>();
  const [photoUploadState, setPhotoUploadState] = useState<ImageUploadState>({
    status: "idle",
  });
  const [breedFocused, setBreedFocused] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(new Date(2020, 0, 1));
  const [dateField, setDateField] = useState<DateField>("birthDate");

  const [indicatorStatus, setIndicatorStatus] = useState<SaveStatus>("idle");
  const indicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const footerAnim = useRef(new Animated.Value(0)).current;
  const footerHeightRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const footerVisibleRef = useRef(true);
  const breedSuggestions = breed.trim()
    ? dogBreeds
        .filter((item) => item.includes(breed.trim()) && item !== breed.trim())
        .slice(0, 5)
    : [];

  function showFooter() {
    footerVisibleRef.current = true;
    Animated.timing(footerAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start();
  }
  function hideFooter() {
    footerVisibleRef.current = false;
    Animated.timing(footerAnim, { toValue: footerHeightRef.current, duration: 220, useNativeDriver: true }).start();
  }
  const BOTTOM_THRESHOLD = 40;
  function isAtEdge(y: number, contentHeight: number, layoutHeight: number) {
    return y <= 0 || y + layoutHeight >= contentHeight - BOTTOM_THRESHOLD;
  }
  function handleScroll(e: any) {
    const y: number = e.nativeEvent.contentOffset.y;
    const contentHeight: number = e.nativeEvent.contentSize.height;
    const layoutHeight: number = e.nativeEvent.layoutMeasurement.height;
    const dy = y - lastScrollYRef.current;
    lastScrollYRef.current = y;
    if (isAtEdge(y, contentHeight, layoutHeight)) {
      if (!footerVisibleRef.current) showFooter();
      return;
    }
    if (dy > 3 && footerVisibleRef.current) hideFooter();
    else if (dy < -3 && !footerVisibleRef.current) showFooter();
  }
  function handleScrollEnd(e: any) {
    const y: number = e.nativeEvent.contentOffset.y;
    const contentHeight: number = e.nativeEvent.contentSize.height;
    const layoutHeight: number = e.nativeEvent.layoutMeasurement.height;
    if (isAtEdge(y, contentHeight, layoutHeight) && !footerVisibleRef.current) showFooter();
  }

  function openDatePicker(field: DateField) {
    const value = field === "birthDate" ? birthDate : adoptionDate;
    const parsed = storageToDate(value);
    setDateField(field);
    setPickerDate(parsed ?? new Date(2020, 0, 1));
    setDatePickerVisible(true);
  }

  function formatStorageDate(value: string) {
    const d = storageToDate(value);
    return d ? formatBirthDate(d) : value;
  }

  function fillForm(pet: PetResponse) {
    const isBirthDateUnknown = pet.birthDateUnknown ?? !pet.birthDate;
    setExternalId(pet.externalId);
    setName(pet.name);
    setBreed(pet.breed ?? "");
    setGender(normalizeGender(pet.gender));
    setBirthDate(isBirthDateUnknown ? "" : (pet.birthDate ?? ""));
    setBirthDateUnknown(isBirthDateUnknown);
    setAdoptionDate(pet.adoptionDate ?? "");
    setWeightKg(pet.weightKg !== undefined ? String(pet.weightKg) : "");
    setNeutered(pet.neutered ?? false);
    setMedicalNotes(pet.medicalNotes ?? "");
    if (pet.photoBase64) setPhotoUri(pet.photoBase64);
  }

  function clearFormForCreate() {
    setExternalId(null);
    setName("");
    setBreed("");
    setGender(null);
    setBirthDate("");
    setBirthDateUnknown(false);
    setAdoptionDate("");
    setWeightKg("");
    setNeutered(false);
    setMedicalNotes("");
    setPhotoUri(undefined);
    setPhotoSourceUri(undefined);
    setPhotoUploadState({ status: "idle" });
    setIndicatorStatus("idle");
  }

  function showError() {
    if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current);
    setIndicatorStatus("error");
    indicatorTimerRef.current = setTimeout(
      () => setIndicatorStatus("idle"),
      2200,
    );
  }

  // 반려동물 전환 시 이전 프로필 즉시 클리어 (create 모드 제외)
  const isMountedRef = useRef(false);
  useEffect(() => {
    if (!isMountedRef.current) { isMountedRef.current = true; return; }
    if (!isCreateMode) clearFormForCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petIdFromContext]);

  useEffect(() => {
    if (isCreateMode) {
      clearFormForCreate();
      return;
    }

    const targetId = petIdFromContext;

    async function load() {
      // 1단계: 캐시에서 즉시 로드
      const cached = targetId ? await getCachedPets() : [];
      if (targetId) {
        const pet = cached.find((p) => p.externalId === targetId);
        if (pet) {
          fillForm(pet);
          const photo = await getCachedPetPhoto(targetId);
          if (photo) setPhotoUri(photo);
        }
      }

      // 2단계: 서버에서 최신 데이터 fetch (백그라운드)
      try {
        const serverPets = await petApi.getPets();
        const mergedPets = serverPets.map((serverPet) => {
          const cachedPet = cached.find(
            (p) => p.externalId === serverPet.externalId,
          );
          return {
            ...serverPet,
            gender:
              normalizeGender(serverPet.gender) ??
              normalizeGender(cachedPet?.gender),
            birthDate: cachedPet?.birthDateUnknown
              ? null
              : (serverPet.birthDate ?? cachedPet?.birthDate),
            birthDateUnknown:
              serverPet.birthDateUnknown ?? cachedPet?.birthDateUnknown,
            adoptionDate: serverPet.adoptionDate ?? cachedPet?.adoptionDate,
          };
        });
        await setCachedPets(mergedPets);

        if (targetId) {
          const serverPet = mergedPets.find((p) => p.externalId === targetId);
          if (serverPet) fillForm(serverPet);
        }
      } catch {
        // 오프라인 또는 서버 에러 — 캐시 유지, 에러 표시 없음
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreateMode, petIdFromContext]);

  async function prepareProfilePhoto(sourceUri: string) {
    setPhotoUploadState({ status: "compressing", progress: 40 });
    try {
      const prepared = await prepareImageForUpload(sourceUri, {
        maxWidth: 512,
        compress: 0.7,
        base64: true,
      });
      setPhotoUri(toBase64DataUri(prepared));
      setPhotoUploadState({ status: "idle" });
    } catch {
      setPhotoUploadState({
        status: "failed",
        errorMessage: "업로드에 실패했어요",
      });
    }
  }

  async function handlePickImage() {
    if (photoUploadState.status !== 'idle' && photoUploadState.status !== 'failed') return;
    const uri = await pickImageUri({ allowsEditing: true, aspect: [1, 1] });
    if (!uri) return;
    setPhotoSourceUri(uri);
    setPhotoUri(uri);
    await prepareProfilePhoto(uri);
  }

  async function handleRetryPhoto() {
    if (!photoSourceUri) return;
    await prepareProfilePhoto(photoSourceUri);
  }

  async function handleSave() {
    if (
      !name.trim() ||
      !breed.trim() ||
      !gender ||
      (!birthDateUnknown && !birthDate.trim()) ||
      !weightKg.trim()
    ) {
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
      setIndicatorStatus("saving");
      setIsSaving(true);
      if (photoUri) {
        setPhotoUploadState({ status: "saving", progress: 90 });
      }

      const body = {
        name: name.trim(),
        species: "dog",
        breed: breed.trim(),
        gender,
        birthDate: birthDateUnknown ? null : birthDate.trim(),
        birthDateUnknown,
        adoptionDate: adoptionDate.trim() || null,
        weightKg: weight,
        neutered,
        medicalNotes: medicalNotes.trim() || undefined,
        photoBase64: photoUri,
      };

      const response = externalId
        ? await petApi.updatePet(externalId, body)
        : await petApi.createPet(body);

      const savedPet = {
        ...response,
        gender: normalizeGender(response.gender) ?? body.gender,
        birthDate: body.birthDateUnknown
          ? null
          : (response.birthDate ?? body.birthDate),
        birthDateUnknown: response.birthDateUnknown ?? body.birthDateUnknown,
        adoptionDate: response.adoptionDate ?? body.adoptionDate,
      };

      // 캐시 업데이트
      await upsertCachedPet(savedPet);
      await setCachedCurrentPetId(savedPet.externalId);
      if (photoUri) await setCachedPetPhoto(savedPet.externalId, photoUri);

      setExternalId(savedPet.externalId);
      setCurrentPet(savedPet);

      if (isCreateMode) {
        router.setParams({ mode: undefined });
      }

      if (photoUri) {
        setPhotoUploadState({ status: "success", progress: 100 });
      }
      setIndicatorStatus("saved");
      indicatorTimerRef.current = setTimeout(() => {
        setIndicatorStatus("idle");
        setPhotoUploadState({ status: "idle" });
      }, 1500);
    } catch (e) {
      console.error("[ProfileScreen] 서버 저장 실패:", e);
      setIndicatorStatus("idle");
      if (photoUri) {
        setPhotoUploadState({
          status: "failed",
          errorMessage: "업로드에 실패했어요",
        });
      }
      Alert.alert("저장 실패", "서버 연결을 확인해주세요.");
    } finally {
      setIsSaving(false);
    }
  }

  async function doDelete() {
    if (!externalId || isDeleting || isSaving) return;
    setIsDeleting(true);
    try {
      await petApi.deletePet(externalId);
      const pets = await getCachedPets();
      const remaining = pets.filter((p) => p.externalId !== externalId);
      await setCachedPets(remaining);
      // 폼 초기화
      setExternalId(null);
      setName("");
      setBreed("");
      setGender(null);
      setBirthDate("");
      setBirthDateUnknown(false);
      setAdoptionDate("");
      setWeightKg("");
      setNeutered(false);
      setMedicalNotes("");
      setPhotoUri(undefined);
      setPhotoSourceUri(undefined);
      setPhotoUploadState({ status: "idle" });
      if (remaining.length > 0) {
        const nextPet = remaining[0];
        await setCachedCurrentPetId(nextPet.externalId);
        setCurrentPet(nextPet);
        fillForm(nextPet);
        const photo = await getCachedPetPhoto(nextPet.externalId);
        if (photo) setPhotoUri(photo);
      } else {
        await AsyncStorage.removeItem("pet-care:api:current-pet-id");
        setCurrentPet(null);
      }
    } catch (e) {
      console.error("[ProfileScreen] 삭제 실패:", e);
      Alert.alert("삭제 실패", "반려동물을 삭제하지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsDeleting(false);
    }
  }

  function confirmDelete() {
    if (!externalId || isDeleting || isSaving) return;
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        `${name} 프로필을 삭제할까요?\n모든 기록이 함께 삭제됩니다.`,
      );
      if (confirmed) void doDelete();
      return;
    }
    Alert.alert(
      "반려동물 삭제",
      `${name} 프로필을 삭제할까요?\n모든 기록이 함께 삭제됩니다.`,
      [
        { text: "취소", style: "cancel" },
        { text: "삭제", style: "destructive", onPress: doDelete },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
      >
        {/* 사진 */}
        <TouchableOpacity style={styles.photoWrapper} onPress={handlePickImage}>
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={styles.photo}
              contentFit="cover"
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderIcon}>📷</Text>
              <Text style={styles.photoPlaceholderText}>사진 추가</Text>
            </View>
          )}
          {photoUploadState.status !== "idle" ? (
            <View
              style={[
                styles.photoStatusOverlay,
                photoUploadState.status === "failed" &&
                  styles.photoStatusErrorOverlay,
              ]}
            >
              {photoUploadState.status !== "failed" &&
              photoUploadState.status !== "success" ? (
                <ActivityIndicator color={colors.textOnPrimary} />
              ) : null}
              {photoUploadState.status === "failed" ? (
                <>
                  <Text style={styles.photoStatusText}>
                    사진을 올리지 못했어요. 다시 시도해주세요.
                  </Text>
                  <TouchableOpacity
                    style={styles.photoRetryButton}
                    onPress={handleRetryPhoto}
                  >
                    <Text style={styles.photoRetryText}>재시도</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          ) : null}
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

        {/* 성별 */}
        <View style={styles.field}>
          <Text style={styles.label}>성별 *</Text>
          <View style={styles.segmentRow}>
            {[
              { value: "female" as const, label: "여자" },
              { value: "male" as const, label: "남자" },
            ].map((option) => {
              const selected = gender === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.segmentButton,
                    selected && styles.segmentButtonActive,
                  ]}
                  onPress={() => setGender(option.value)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      selected && styles.segmentTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 견종 */}
        <View style={styles.field}>
          <Text style={styles.label}>견종 *</Text>
          <TextInput
            style={styles.input}
            value={breed}
            onChangeText={(text) => {
              setBreed(text);
              setBreedFocused(true);
            }}
            onFocus={() => setBreedFocused(true)}
            placeholder="예: 말티즈, 포메라니안"
            placeholderTextColor={colors.textQuaternary}
          />
          {breedFocused && breedSuggestions.length > 0 ? (
            <View style={styles.suggestionBox}>
              {breedSuggestions.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.suggestionItem}
                  onPressIn={() => {
                    setBreed(item);
                    setBreedFocused(false);
                  }}
                >
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        {/* 생일 */}
        <View style={styles.field}>
          <Text style={styles.label}>생일 *</Text>
          <TouchableOpacity
            style={[
              styles.input,
              styles.dateButton,
              birthDateUnknown && styles.inputDisabled,
            ]}
            onPress={() => openDatePicker("birthDate")}
            disabled={birthDateUnknown}
          >
            <Text
              style={
                birthDate && !birthDateUnknown
                  ? styles.dateText
                  : styles.datePlaceholder
              }
            >
              {birthDateUnknown
                ? "생일 모름"
                : birthDate
                  ? formatStorageDate(birthDate)
                  : "생일 선택"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => {
              const next = !birthDateUnknown;
              setBirthDateUnknown(next);
              if (next) setBirthDate("");
            }}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.checkbox,
                birthDateUnknown && styles.checkboxActive,
              ]}
            >
              {birthDateUnknown ? (
                <Text style={styles.checkboxMark}>✓</Text>
              ) : null}
            </View>
            <Text style={styles.checkText}>생일 모름</Text>
          </TouchableOpacity>
        </View>

        {/* 함께한 날 */}
        <View style={styles.field}>
          <Text style={styles.label}>함께한 날 (선택)</Text>
          <TouchableOpacity
            style={[styles.input, styles.dateButton]}
            onPress={() => openDatePicker("adoptionDate")}
          >
            <Text
              style={adoptionDate ? styles.dateText : styles.datePlaceholder}
            >
              {adoptionDate
                ? formatStorageDate(adoptionDate)
                : "함께한 날 선택"}
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
                <Text style={styles.modalTitle}>
                  {dateField === "birthDate" ? "생일 선택" : "함께한 날 선택"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const value = dateToStorage(pickerDate);
                    if (dateField === "birthDate") {
                      setBirthDate(value);
                      setBirthDateUnknown(false);
                    } else {
                      setAdoptionDate(value);
                    }
                    setDatePickerVisible(false);
                  }}
                >
                  <Text style={styles.modalDone}>완료</Text>
                </TouchableOpacity>
              </View>

              {Platform.OS === "web" ? (
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

      {/* 저장/삭제 버튼 */}
      <Animated.View
        style={[styles.footer, { transform: [{ translateY: footerAnim }] }]}
        onLayout={(e) => { footerHeightRef.current = e.nativeEvent.layout.height; }}
      >
        <TouchableOpacity
          style={[styles.saveButton, (isSaving || isDeleting) && styles.saveButtonDisabled]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={isSaving || isDeleting}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? "저장 중..." : "저장"}
          </Text>
        </TouchableOpacity>
        {isCreateMode ? (
          <TouchableOpacity
            style={[styles.cancelButton, (isSaving || isDeleting) && styles.saveButtonDisabled]}
            onPress={() => router.setParams({ mode: undefined })}
            activeOpacity={0.8}
            disabled={isSaving || isDeleting}
          >
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
        ) : null}
        {!isCreateMode && externalId ? (
          <TouchableOpacity
            style={[styles.deleteButton, (isSaving || isDeleting) && styles.deleteButtonDisabled]}
            onPress={confirmDelete}
            activeOpacity={0.8}
            disabled={isSaving || isDeleting}
          >
            <Text style={styles.deleteButtonText}>
              {isDeleting ? "삭제 중..." : "반려동물 삭제"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </Animated.View>

      <SaveIndicator
        status={indicatorStatus}
        labels={{
          saving: "서버에 저장 중...",
          saved: "저장되었습니다 ✓",
          error: "필수 항목을 입력해주세요",
        }}
        textColors={{
          saving: "rgba(255,255,255,0.90)",
          saved: "rgba(255,255,255,0.90)",
          error: "rgba(255,255,255,0.90)",
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
    alignSelf: "center",
    marginBottom: spacing.xxl,
    width: 120,
    height: 120,
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
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  photoStatusOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.full,
    backgroundColor: "rgba(25,31,40,0.58)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
    gap: spacing.xs,
  },
  photoStatusErrorOverlay: {
    backgroundColor: "rgba(233,75,90,0.72)",
  },
  photoStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textOnPrimary,
    textAlign: "center",
  },
  photoRetryButton: {
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  photoRetryText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.danger,
  },
  field: {
    marginBottom: spacing.lg + 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
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
  inputDisabled: {
    opacity: 0.65,
  },
  segmentRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  segmentButton: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  segmentText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.textOnPrimary,
  },
  suggestionBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  suggestionItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  suggestionText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    alignSelf: "flex-start",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxMark: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textOnPrimary,
  },
  checkText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  weightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  weightInput: {
    flex: 1,
  },
  weightUnit: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    justifyContent: "center",
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
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  modalCancel: {
    fontSize: 16,
    color: colors.textTertiary,
  },
  modalDone: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  webPickerWrapper: {
    padding: spacing.xl,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textOnPrimary,
  },
  deleteButton: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.danger,
  },
  cancelButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});
