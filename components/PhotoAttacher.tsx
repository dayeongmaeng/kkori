import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { pickImage } from '../lib/imagePickerHelper';

const MAX_PHOTOS = 3;

interface Props {
  photoUris: string[];
  onChangePhotoUris: (uris: string[]) => void;
}

export default function PhotoAttacher({ photoUris, onChangePhotoUris }: Props) {
  async function handleAdd() {
    const dataUri = await pickImage({ allowsEditing: false });
    if (!dataUri) return;
    onChangePhotoUris([...photoUris, dataUri]);
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
    gap: spacing.sm,
  },
  photoWrapper: {
    width: 80,
    height: 80,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: radius.sm,
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  addBtn: {
    width: 80,
    height: 80,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.textQuaternary,
    lineHeight: 34,
  },
});
