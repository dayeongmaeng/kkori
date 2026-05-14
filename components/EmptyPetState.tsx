import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

export default function EmptyPetState() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🐾</Text>
      <Text style={styles.message}>반려동물을 먼저 등록해주세요</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/profile')}>
        <Text style={styles.buttonText}>프로필 등록하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  emoji: {
    fontSize: 56,
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
});
