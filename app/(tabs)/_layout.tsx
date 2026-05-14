import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Camera, Home, NotebookPen, PawPrint } from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';
import { colors } from '../../constants/theme';

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <AppHeader />
      <Tabs
        initialRouteName="home"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: '홈',
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: '포토',
            tabBarIcon: ({ color }) => <Camera size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="log"
          options={{
            title: '기록',
            tabBarIcon: ({ color }) => <NotebookPen size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: '프로필',
            tabBarIcon: ({ color }) => <PawPrint size={24} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
