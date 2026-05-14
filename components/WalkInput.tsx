import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const QUICK_MINUTES = [15, 30, 60, 90];

interface Props {
  minutes?: number;
  note?: string;
  onChangeMinutes: (value: number | undefined) => void;
  onChangeNote: (value: string) => void;
}

export default function WalkInput({ minutes, note, onChangeMinutes, onChangeNote }: Props) {
  function handleTextChange(text: string) {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned === '') {
      onChangeMinutes(undefined);
      return;
    }
    const num = parseInt(cleaned, 10);
    onChangeMinutes(isNaN(num) ? undefined : num);
  }

  return (
    <View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.minutesInput}
          value={minutes !== undefined ? String(minutes) : ''}
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
          const selected = minutes === min;
          return (
            <TouchableOpacity
              key={min}
              style={[styles.quickBtn, selected && styles.quickBtnSelected]}
              onPress={() => onChangeMinutes(min)}
              activeOpacity={0.7}
            >
              <Text style={[styles.quickBtnText, selected && styles.quickBtnTextSelected]}>
                {min}분
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TextInput
        style={styles.noteInput}
        value={note}
        onChangeText={onChangeNote}
        placeholder="산책 장소, 특이사항 (선택)"
        placeholderTextColor="#C4B8A8"
        maxLength={100}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minutesInput: {
    width: 80,
    fontSize: 24,
    fontWeight: '700',
    color: '#3D2C1E',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#E8985C',
    paddingBottom: 2,
  },
  unit: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5C4A38',
    marginLeft: 8,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  quickBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#3D2C1E',
  },
});
