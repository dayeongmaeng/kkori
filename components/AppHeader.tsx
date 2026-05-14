import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.logo}>🐾 꼬리</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  logo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3D2C1E',
  },
});
