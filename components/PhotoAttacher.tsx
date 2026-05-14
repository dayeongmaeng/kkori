import * as ImagePicker from 'expo-image-picker';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { uriToBase64 } from '../lib/photoUtils';

const MAX_PHOTOS = 3;

interface Props {
  photoUris: string[];
  onChangePhotoUris: (uris: string[]) => void;
}

export default function PhotoAttacher({ photoUris, onChangePhotoUris }: Props) {
  async function handleAdd() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]) return;

    try {
      const base64 = await uriToBase64(result.assets[0].uri);
      onChangePhotoUris([...photoUris, base64]);
    } catch {
      // 변환 실패 시 조용히 무시
    }
  }

  function handleRemove(index: number) {
    onChangePhotoUris(photoUris.filter((_, i) => i !== index));
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.row}>
        {photoUris.map((uri, index) => (
          <View key={index} style={styles.photoWrapper}>
            <Image source={{ uri }} style={styles.photo} />
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemove(index)}
              activeOpacity={0.7}
            >
              <Text style={styles.removeBtnText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}

        {photoUris.length < MAX_PHOTOS && (
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.7}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  photoWrapper: {
    width: 80,
    height: 80,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3D2C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  addBtn: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C4B8A8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#C4B8A8',
    lineHeight: 34,
  },
});
