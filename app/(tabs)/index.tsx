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
import { uriToBase64 } from '../../lib/photoUtils';
import {
  getCurrentPetId,
  getDailyPhotoByDate,
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

function EmptyGrid() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📷</Text>
      <Text style={styles.emptyTitle}>첫 사진을 남겨보세요</Text>
      <Text style={styles.emptySubtitle}>매일 한 장씩 쌓이는 소중한 기록이에요</Text>
    </View>
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
  const hasTodayPhoto = photos.some((p) => p.date === today);

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

  useEffect(() => {
    load();
  }, [load]);

  // 상세 화면에서 삭제 후 돌아왔을 때 그리드 자동 갱신
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function handleAddPhoto() {
    const petId = await getCurrentPetId();
    if (!petId) {
      Alert.alert('알림', '프로필 탭에서 반려동물을 먼저 등록해주세요.');
      return;
    }

    const existing = await getDailyPhotoByDate(petId, today);
    if (existing) {
      Alert.alert('알림', '이미 오늘 사진이 있어요. 내일 와주세요 🐾');
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

    try {
      setConverting(true);
      const base64 = await uriToBase64(result.assets[0].uri);
      setPendingBase64(base64);
      setModalVisible(true);
    } catch {
      Alert.alert('오류', '사진을 처리하지 못했어요. 다시 시도해주세요.');
    } finally {
      setConverting(false);
    }
  }

  async function handleSavePhoto(caption: string) {
    setModalVisible(false);

    const petId = await getCurrentPetId();
    if (!petId || !pendingBase64) return;

    const now = new Date().toISOString();
    const photo: DailyPhoto = {
      id: generateId(),
      petId,
      date: today,
      photoUri: pendingBase64,
      caption: caption || undefined,
      caregiverId: '',  // storage에서 자동 채움
      createdAt: now,
    };

    try {
      await saveDailyPhoto(photo);
      setPendingBase64(null);
      Alert.alert('저장됐어요', `${formatDateKorean(today)} 사진이 저장됐어요.`);
      await load();
    } catch {
      Alert.alert('오류', '저장에 실패했어요. 다시 시도해주세요.');
    }
  }

  function handleCancelModal() {
    setModalVisible(false);
    setPendingBase64(null);
  }

  function handleCellPress(photo: DailyPhoto) {
    router.push(`/photo/${photo.id}`);
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {pet ? `${pet.name} · ${photos.length}장` : '포토'}
        </Text>
        <TouchableOpacity
          style={[
            styles.addButton,
            (hasTodayPhoto || converting) && styles.addButtonDisabled,
          ]}
          disabled={hasTodayPhoto || converting}
          onPress={handleAddPhoto}
        >
          <Text
            style={[
              styles.addButtonText,
              (hasTodayPhoto || converting) && styles.addButtonTextDisabled,
            ]}
          >
            {converting ? '처리 중...' : '오늘 사진 추가'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 그리드 */}
      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <PhotoCell photo={item} onPress={() => handleCellPress(item)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={<EmptyGrid />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8985C" />
        }
        contentContainerStyle={photos.length === 0 ? styles.emptyList : undefined}
      />

      {/* 캡션 모달 */}
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
    justifyContent: 'space-between',
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
  addButton: {
    backgroundColor: '#E8985C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonDisabled: {
    backgroundColor: '#E0D6C8',
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addButtonTextDisabled: {
    color: '#A89880',
  },
  row: {
    gap: 2,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 80,
  },
  emptyEmoji: {
    fontSize: 52,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3D2C1E',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8C7B6B',
  },
});
