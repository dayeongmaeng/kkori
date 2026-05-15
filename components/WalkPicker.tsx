import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const QUICK_MINUTES = [15, 30, 60];

interface Props {
  walkMinutes?: number;
  walkNote?: string;
  onChangeMinutes: (value: number | undefined) => void;
  onChangeNote: (value: string) => void;
}

export default function WalkPicker({ walkMinutes, walkNote, onChangeMinutes, onChangeNote }: Props) {
  function handleTextChange(text: string) {
    const num = parseInt(text, 10);
    onChangeMinutes(isNaN(num) ? undefined : num);
  }

  function handleQuickSelect(minutes: number) {
    onChangeMinutes(minutes);
  }

  return (
    <View>
      <View style={styles.topRow}>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.minutesInput}
            value={walkMinutes !== undefined ? String(walkMinutes) : ''}
            onChangeText={handleTextChange}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#C4B8A8"
            maxLength={3}
          />
          <Text style={styles.unit}>분</Text>
        </View>

        <View style={styles.quickRow}>
          {QUICK_MINUTES.map((min) => {
            const selected = walkMinutes === min;
            return (
              <TouchableOpacity
                key={min}
                style={[styles.quickBtn, selected && styles.quickBtnSelected]}
                onPress={() => handleQuickSelect(min)}
                activeOpacity={0.7}
              >
                <Text style={[styles.quickBtnText, selected && styles.quickBtnTextSelected]}>
                  {min}분
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TextInput
        style={styles.noteInput}
        value={walkNote}
        onChangeText={onChangeNote}
        placeholder="산책 장소, 특이사항"
        placeholderTextColor="#C4B8A8"
        maxLength={100}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  minutesInput: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3D2C1E',
    width: 56,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#E8985C',
    paddingBottom: 2,
  },
  unit: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5C4A38',
    marginBottom: 3,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  quickBtnSelected: {
    backgroundColor: '#E8985C',
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
  },
  quickBtnTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  noteInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#3D2C1E',
  },
});
