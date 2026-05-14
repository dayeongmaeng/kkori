import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import CaptionModal from '../../components/CaptionModal';
import TodayPhotoCard from '../../components/TodayPhotoCard';
import { uriToBase64 } from '../../lib/photoUtils';
import {
  getCurrentPetId,
  getDailyPhotos,
  getPet,
  saveDailyPhoto,
} from '../../lib/storage';
import { DailyPhoto, Pet } from '../../lib/types';

const CELL_SIZE = Math.floor(Dimensions.get('window').width / 3);

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function PhotoCell({ photo, onPress }: { photo: DailyPhoto; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: photo.photoUri }} style={styles.cell} contentFit="cover" />
    </TouchableOpacity>
  );
}

export default function PhotoScreen() {
  const [pet, setPet] = useState<Pet | null>(null);
  const [photos, setPhotos] = useState<DailyPhoto[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [pendingBase64, setPendingBase64] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const today = getTodayString();
  const todayPhoto = photos.find((p) => p.date === today);
  const pastPhotos = photos.filter((p) => p.date !== today);

  const load = useCallback(async () => {
    const petId = await getCurrentPetId();
    if (!petId) return;
    const [loadedPet, loadedPhotos] = await Promise.all([
      getPet(petId),
      getDailyPhotos(petId),
    ]);
    setPet(loadedPet);
    setPhotos(loadedPhotos);
  }, []);

  useEffect(() => { load(); }, [load]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function processPickedImage(uri: string) {
    try {
      setConverting(true);
      const base64 = await uriToBase64(uri);
      setPendingBase64(base64);
      setModalVisible(true);
    } catch {
      Alert.alert('오류', '사진을 처리하지 못했어요. 다시 시도해주세요.');
    } finally {
      setConverting(false);
    }
  }

  async function handleTakePhoto() {
    if (converting) return;
    const petId = await getCurrentPetId();
    if (!petId) {
      Alert.alert('알림', '프로필 탭에서 반려동물을 먼저 등록해주세요.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('카메라 권한이 필요해요', '설정에서 카메라 접근을 허용해주세요.');
      return;
    }

    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
    } catch {
      // 웹 등 카메라 미지원 환경에서 갤러리로 폴백
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
    }

    if (result.canceled) return;
    await processPickedImage(result.assets[0].uri);
  }

  async function handleOpenGallery() {
    if (converting) return;
    const petId = await getCurrentPetId();
    if (!petId) {
      Alert.alert('알림', '프로필 탭에서 반려동물을 먼저 등록해주세요.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    await processPickedImage(result.assets[0].uri);
  }

  function handleTapTodayPhoto() {
    if (todayPhoto) router.push(`/photo/${todayPhoto.id}`);
  }

  async function handleSavePhoto(caption: string) {
    setModalVisible(false);
    const petId = await getCurrentPetId();
    if (!petId || !pendingBase64) return;

    const photo: DailyPhoto = {
      id: generateId(),
      petId,
      date: today,
      photoUri: pendingBase64,
      caption: caption || undefined,
      caregiverId: '',
      createdAt: new Date().toISOString(),
    };

    try {
      await saveDailyPhoto(photo);
      setPendingBase64(null);
      await load();
    } catch {
      Alert.alert('오류', '저장에 실패했어요. 다시 시도해주세요.');
    }
  }

  function handleCancelModal() {
    setModalVisible(false);
    setPendingBase64(null);
  }

  const listHeader = (
    <View style={styles.headerSection}>
      <TodayPhotoCard
        todayPhoto={todayPhoto}
        onTapCamera={handleTakePhoto}
        onTapGallery={handleOpenGallery}
        onTapPhoto={handleTapTodayPhoto}
      />
      {pastPhotos.length > 0 && (
        <Text style={styles.sectionLabel}>지난 사진</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {pet ? `${pet.name} · ${photos.length}장` : '포토'}
        </Text>
      </View>

      <FlatList
        data={pastPhotos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => (
          <PhotoCell photo={item} onPress={() => router.push(`/photo/${item.id}`)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8985C" />
        }
      />

      {pendingBase64 && (
        <CaptionModal
          visible={modalVisible}
          photoBase64={pendingBase64}
          onSave={handleSavePhoto}
          onCancel={handleCancelModal}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAE0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3D2C1E',
  },
  headerSection: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 13,
    color: '#999999',
    marginTop: 20,
    marginBottom: 8,
  },
  row: {
    gap: 2,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
});
