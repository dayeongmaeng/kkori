import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { getCurrentPetId, getPet, savePet, setCurrentPetId } from '../../lib/storage';
import { uriToBase64 } from '../../lib/photoUtils';
import { Pet } from '../../lib/types';

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
  const [photoLoading, setPhotoLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const currentId = await getCurrentPetId();
      if (!currentId) return;
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
        // blob:/  file:// 는 새로고침 시 무효 → 무시 (legacy 데이터)
        const uri = saved.photoUri;
        if (uri && !uri.startsWith('blob:') && !uri.startsWith('file://')) {
          setPhotoUri(uri);
        }
      }
    })();
  }, []);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    try {
      setPhotoLoading(true);
      const base64 = await uriToBase64(result.assets[0].uri);
      setPhotoUri(base64);
    } catch {
      Alert.alert('오류', '사진 처리에 실패했어요. 다시 시도해주세요.');
    } finally {
      setPhotoLoading(false);
    }
  }

  async function handleSave() {
    if (!name.trim() || !breed.trim() || !birthDate.trim() || !weightKg.trim()) {
      Alert.alert('입력 오류', '이름, 견종, 생일, 체중은 필수 항목이에요.');
      return;
    }
    const weight = parseFloat(weightKg);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('입력 오류', '체중을 올바르게 입력해주세요.');
      return;
    }
    const now = new Date().toISOString();
    const pet: Pet = {
      id: petId ?? generateId(),
      species: 'dog',
      name: name.trim(),
      breed: breed.trim(),
      birthDate: birthDate.trim(),
      weightKg: weight,
      neutered,
      medicalNotes: medicalNotes.trim() || undefined,
      photoUri,
      caregiverIds: [],  // storage에서 자동 채움
      createdAt: createdAt ?? now,
    };
    try {
      await savePet(pet);
      await setCurrentPetId(pet.id);
      setPetId(pet.id);
      setCreatedAt(pet.createdAt);
      Alert.alert('저장됐어요', `${pet.name}의 프로필이 저장됐어요.`);
    } catch {
      Alert.alert('오류', '저장에 실패했어요. 다시 시도해주세요.');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>강아지 프로필</Text>

      {/* 사진 */}
      <TouchableOpacity style={styles.photoWrapper} onPress={pickImage} disabled={photoLoading}>
        {photoLoading ? (
          <View style={styles.photoPlaceholder}>
            <ActivityIndicator color="#E8985C" />
            <Text style={styles.photoPlaceholderText}>사진 처리 중...</Text>
          </View>
        ) : photoUri ? (
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
          placeholderTextColor="#C4B8A8"
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
          placeholderTextColor="#C4B8A8"
        />
      </View>

      {/* 생일 */}
      <View style={styles.field}>
        <Text style={styles.label}>생일 *</Text>
        <TextInput
          style={styles.input}
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="YYYY-MM-DD (예: 2020-03-15)"
          placeholderTextColor="#C4B8A8"
          keyboardType="numeric"
          maxLength={10}
        />
      </View>

      {/* 체중 */}
      <View style={styles.field}>
        <Text style={styles.label}>체중 *</Text>
        <View style={styles.weightRow}>
          <TextInput
            style={[styles.input, styles.weightInput]}
            value={weightKg}
            onChangeText={setWeightKg}
            placeholder="0.0"
            placeholderTextColor="#C4B8A8"
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
            trackColor={{ false: '#E0D6C8', true: '#E8985C' }}
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
          placeholderTextColor="#C4B8A8"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* 저장 버튼 */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>저장</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3D2C1E',
    marginBottom: 24,
  },
  photoWrapper: {
    alignSelf: 'center',
    marginBottom: 32,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EDE8E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: '#8C7B6B',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C4A38',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#3D2C1E',
    borderWidth: 1,
    borderColor: '#E8E0D5',
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weightInput: {
    flex: 1,
  },
  weightUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5C4A38',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E8E0D5',
  },
  textarea: {
    height: 120,
    paddingTop: 14,
  },
  saveButton: {
    backgroundColor: '#E8985C',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
